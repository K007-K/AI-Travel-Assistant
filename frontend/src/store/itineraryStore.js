import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { generateTransportSegments, CURRENCY_MULTIPLIERS } from '../utils/transportEngine';
import { orchestrateTrip } from '../engine/tripOrchestrator';
import { generateAllBookingSuggestions } from '../engine/bookingSuggestionEngine';

// ── Time Scheduling Utilities ────────────────────────────────────────

function timeToMinutes(t) {
    const [h, m] = (t || '09:00').split(':').map(Number);
    return h * 60 + m;
}

function minutesToTime(mins) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Redistribute activity times evenly across the day window.
 * Only affects non-logistics activities (transport/accommodation keep their times).
 * Persists updated times to the database.
 *
 * @param {object[]} activities — All activities for the day
 * @param {string} dayStart — Day window start (default '08:00')
 * @param {string} dayEnd — Day window end (default '20:00')
 * @param {boolean} persist — If true, persist time changes to DB
 * @returns {object[]} Activities with redistributed times
 */
async function redistributeTimes(activities, dayStart = '08:00', dayEnd = '20:00', persist = true) {
    const schedulable = activities.filter(a => !a.isLogistics);
    const logistics = activities.filter(a => a.isLogistics);

    if (schedulable.length === 0) return activities;

    const startMin = timeToMinutes(dayStart);
    const endMin = timeToMinutes(dayEnd);
    const totalWindow = endMin - startMin;
    const gap = Math.floor(totalWindow / Math.max(schedulable.length, 1));

    // Assign evenly spaced times
    schedulable.forEach((act, i) => {
        act.time = minutesToTime(startMin + (i * gap));
    });

    // Persist to DB if requested
    if (persist) {
        const updates = schedulable.map(act =>
            supabase
                .from('trip_segments')
                .select('metadata')
                .eq('id', act.id)
                .single()
                .then(({ data: seg }) =>
                    supabase
                        .from('trip_segments')
                        .update({ metadata: { ...(seg?.metadata || {}), time: act.time } })
                        .eq('id', act.id)
                )
        );
        await Promise.all(updates);
    }

    // Return merged and sorted by time
    return [...logistics, ...schedulable].sort((a, b) =>
        timeToMinutes(a.time || '09:00') - timeToMinutes(b.time || '09:00')
    );
}

// ── Rule 5: Strict Budget Guard ──────────────────────────────────────

/**
 * Check if adding a segment would exceed strict budget.
 * Returns { allowed: true } or { allowed: false, message: string }.
 */
async function checkStrictBudget(tripId, newCost) {
    // Fetch the trip to check budget_type
    const { data: trip } = await supabase
        .from('trips')
        .select('budget, budget_type')
        .eq('id', tripId)
        .single();

    if (!trip || trip.budget_type !== 'strict' || !trip.budget) {
        return { allowed: true };
    }

    // Sum existing segment costs (exclude gems — Rule 7)
    const { data: segments } = await supabase
        .from('trip_segments')
        .select('estimated_cost, type')
        .eq('trip_id', tripId)
        .neq('type', 'gem');

    const cumulativeCost = (segments || []).reduce(
        (sum, s) => sum + (parseFloat(s.estimated_cost) || 0), 0
    );

    const totalAfter = cumulativeCost + (parseFloat(newCost) || 0);

    if (totalAfter > parseFloat(trip.budget)) {
        return {
            allowed: false,
            message: `Budget exceeded in strict mode. Current: ${Math.round(cumulativeCost)}, Adding: ${Math.round(newCost)}, Limit: ${trip.budget}`,
        };
    }

    return { allowed: true };
}

// ── Helpers ──────────────────────────────────────────────────────────

/** Map a trip_segment row's type to a UI-friendly activity type string */
function segmentTypeToActivityType(seg) {
    if (seg.type === 'activity') return seg.metadata?.activityType || 'sightseeing';
    if (seg.type === 'gem') return 'gem'; // Rule 7: Hidden gems have distinct type
    // Logistics types pass through directly (outbound_travel, return_travel, etc.)
    return seg.type;
}

/**
 * Reconstruct the virtual `days` array that ItineraryBuilder expects
 * from a flat list of trip_segments rows.
 *
 * Shape produced per day:
 *   { id: "day-1", dayNumber: 1, location: "Paris", activities: [...] }
 *
 * Each activity inside keeps its segment UUID as `id`, so all downstream
 * code (delete, toggle, reorder, cost_events) uses the real PK.
 */
function buildDaysFromSegments(segments, trip) {
    if (!segments || segments.length === 0) return [];

    // Group by day_number
    const byDay = {};
    segments.forEach(seg => {
        const dn = seg.day_number;
        if (!byDay[dn]) byDay[dn] = [];
        byDay[dn].push(seg);
    });

    // Determine day location from trip.segments (the multi-city config) if available
    const tripSegments = trip.segments || [];

    const dayNumbers = Object.keys(byDay).map(Number).sort((a, b) => a - b);
    return dayNumbers.map(dn => {
        const segs = byDay[dn].sort((a, b) => a.order_index - b.order_index);
        // Find location: first non-null location in this day's segments, or trip destination
        const dayLocation = segs.find(s => s.location)?.location
            || getDayLocationFromTripSegments(tripSegments, dn)
            || trip.destination;

        return {
            id: `day-${dn}`,
            dayNumber: dn,
            location: dayLocation,
            activities: segs.map(seg => ({
                id: seg.id,                          // UUID from trip_segments — real PK
                title: seg.title,
                time: seg.start_time ? new Date(seg.start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : (seg.metadata?.time || '09:00'),
                type: segmentTypeToActivityType(seg),
                location: seg.location || dayLocation,
                notes: seg.metadata?.notes || '',
                estimated_cost: parseFloat(seg.estimated_cost) || 0,
                safety_warning: seg.metadata?.safety_warning || null,
                isCompleted: seg.metadata?.isCompleted || false,
                rating: seg.metadata?.rating || 0,
                order_index: seg.order_index ?? 0, // Rule 10: Pass through for map ordering
                // Embedded coordinates (from orchestrator geocoding)
                latitude: seg.metadata?.latitude || null,
                longitude: seg.metadata?.longitude || null,
                // Logistics metadata
                segmentType: seg.type,
                transportMode: seg.metadata?.transport_mode || null,
                isLogistics: ['outbound_travel', 'return_travel', 'intercity_travel', 'local_transport', 'accommodation'].includes(seg.type),
                isGem: seg.type === 'gem', // Rule 7: Flag gems for UI isolation
            }))
        };
    });
}

/** Look up which location a day belongs to based on the trip's multi-city segments config */
function getDayLocationFromTripSegments(tripSegments, dayNumber) {
    let cumulative = 0;
    for (const seg of tripSegments) {
        cumulative += (seg.days || 0);
        if (dayNumber <= cumulative) return seg.location;
    }
    return null;
}

/**
 * One-time migration: convert legacy JSONB `days` array into trip_segments rows.
 * Called automatically when a trip with JSONB days but no trip_segments is opened.
 */
async function migrateJsonbToSegments(tripId, days) {
    if (!days || days.length === 0) return [];

    const rows = [];
    days.forEach(day => {
        if (!day.activities || day.activities.length === 0) {
            // Insert a placeholder so the day is still represented
            rows.push({
                trip_id: tripId,
                type: 'activity',
                title: '__placeholder__',
                day_number: day.dayNumber,
                location: day.location || null,
                estimated_cost: 0,
                order_index: 0,
                metadata: { placeholder: true },
            });
        } else {
            day.activities.forEach((act, idx) => {
                rows.push({
                    trip_id: tripId,
                    type: 'activity',
                    title: act.title,
                    day_number: day.dayNumber,
                    location: act.location || day.location || null,
                    estimated_cost: parseFloat(act.estimated_cost) || 0,
                    order_index: idx,
                    metadata: {
                        time: act.time || '09:00',
                        activityType: act.type || 'sightseeing',
                        notes: act.notes || '',
                        safety_warning: act.safety_warning || null,
                        isCompleted: act.isCompleted || false,
                        rating: act.rating || 0,
                        legacy_id: act.id, // preserve old UUID for cost_events linkage
                    },
                });
            });
        }
    });

    const { data, error } = await supabase
        .from('trip_segments')
        .insert(rows)
        .select();

    if (error) {
        console.error('Migration to trip_segments failed:', error);
        return [];
    }

    // days column has been dropped — data lives entirely in trip_segments

    console.log(`Migrated ${rows.length} segments for trip ${tripId}`);
    return data;
}

// ── Store ────────────────────────────────────────────────────────────

const useItineraryStore = create((set, get) => ({
    trips: [],
    currentTrip: null,
    isLoading: false,
    error: null,

    // ── Lifecycle Orchestration State ─────────────────────────────────
    allocation: null,          // Budget allocation from Phase 1
    reconciliation: null,      // Budget reconciliation from Phase 10
    dailySummary: [],          // Per-day cost breakdown from Phase 8
    bookingOptions: {},        // Booking suggestions keyed by segment_id (Phase 7)
    hiddenGems: [],            // Isolated hidden gems (Phase 9)
    orchestrationPhase: null,  // Current phase name for progress UI

    // ── Fetch ────────────────────────────────────────────────────────
    fetchTrips: async () => {
        set({ isLoading: true, error: null });
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: trips, error } = await supabase
                .from('trips')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Fetch all segments for this user's trips in one query
            const tripIds = trips.map(t => t.id);
            let allSegments = [];
            if (tripIds.length > 0) {
                const { data: segs, error: segErr } = await supabase
                    .from('trip_segments')
                    .select('*')
                    .in('trip_id', tripIds)
                    .order('day_number', { ascending: true })
                    .order('order_index', { ascending: true });

                if (!segErr) allSegments = segs || [];
            }

            // Group segments by trip_id
            const segsByTrip = {};
            allSegments.forEach(seg => {
                if (!segsByTrip[seg.trip_id]) segsByTrip[seg.trip_id] = [];
                segsByTrip[seg.trip_id].push(seg);
            });

            // Build virtual days for each trip
            const enrichedTrips = trips.map(trip => {
                const tripSegs = segsByTrip[trip.id] || [];
                if (tripSegs.length > 0) {
                    // Trip has segments — build days from them
                    // Filter out placeholders for display
                    const realSegs = tripSegs.filter(s => s.title !== '__placeholder__');
                    return {
                        ...trip,
                        days: buildDaysFromSegments(tripSegs, trip),
                        _hasSegments: true,
                    };
                } else if (trip.days && trip.days.length > 0) {
                    // Legacy trip — keep JSONB days, will migrate on open
                    return { ...trip, _hasSegments: false };
                } else {
                    // Trip with no days and no segments
                    return { ...trip, days: [], _hasSegments: false };
                }
            });

            set({ trips: enrichedTrips, isLoading: false });
        } catch (error) {
            console.error('Error fetching trips:', error);
            set({ error: error.message, isLoading: false });
        }
    },

    // ── Ensure trip has segments (auto-migrate legacy JSONB) ──────────
    ensureSegments: async (tripId) => {
        const store = get();
        const trip = store.trips.find(t => t.id === tripId);
        if (!trip || trip._hasSegments) return;

        if (trip.days && trip.days.length > 0) {
            const newSegments = await migrateJsonbToSegments(tripId, trip.days);
            if (newSegments.length > 0) {
                const rebuiltDays = buildDaysFromSegments(newSegments, trip);
                set(state => ({
                    trips: state.trips.map(t =>
                        t.id === tripId ? { ...t, days: rebuiltDays, _hasSegments: true } : t
                    ),
                }));
            }
        }
    },

    // ── Create ───────────────────────────────────────────────────────
    createTrip: async (tripData) => {
        set({ isLoading: true, error: null });
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const segments = tripData.segments || [
                { location: tripData.destination, days: tripData.duration }
            ];

            // Calculate total days
            const totalDays = segments.reduce((sum, s) => sum + (s.days || 0), 0);

            const newTrip = {
                user_id: user.id,
                title: tripData.title,
                destination: segments[0].location,
                start_date: tripData.startDate,
                end_date: tripData.endDate,
                budget: tripData.budget || 0,
                currency: tripData.currency || 'USD',
                travelers: tripData.travelers || 1,
                pinned: false,
                // Constraint-driven fields
                start_location: tripData.start_location || null,
                return_location: tripData.return_location || null,
                travel_style: tripData.travel_style || null,
                own_vehicle_type: tripData.own_vehicle_type || 'none',
                travel_preference: tripData.travel_preference || 'any',
                accommodation_preference: tripData.accommodation_preference || 'mid-range',
            };

            const { data, error } = await supabase
                .from('trips')
                .insert([newTrip])
                .select()
                .single();

            if (error) throw error;

            // Create placeholder segments for each day so the day selector works
            const segmentRows = [];
            let dayCount = 0;
            segments.forEach(seg => {
                for (let i = 0; i < seg.days; i++) {
                    dayCount++;
                    segmentRows.push({
                        trip_id: data.id,
                        type: 'activity',
                        title: '__placeholder__',
                        day_number: dayCount,
                        location: seg.location,
                        estimated_cost: 0,
                        order_index: 0,
                        metadata: { placeholder: true },
                    });
                }
            });

            if (segmentRows.length > 0) {
                await supabase.from('trip_segments').insert(segmentRows);
            }

            // Build virtual days array for the store
            const virtualDays = [];
            dayCount = 0;
            segments.forEach(seg => {
                for (let i = 0; i < seg.days; i++) {
                    dayCount++;
                    virtualDays.push({
                        id: `day-${dayCount}`,
                        dayNumber: dayCount,
                        location: seg.location,
                        activities: [],
                    });
                }
            });

            const enrichedTrip = { ...data, days: virtualDays, _hasSegments: true };

            set(state => ({
                trips: [enrichedTrip, ...state.trips],
                currentTrip: enrichedTrip,
                isLoading: false,
            }));
            return data.id;
        } catch (error) {
            console.error('Error creating trip:', error);
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    // ── Delete Trip ──────────────────────────────────────────────────
    deleteTrip: async (tripId) => {
        set({ isLoading: true, error: null });
        try {
            // trip_segments cascade-deletes via FK
            const { error } = await supabase
                .from('trips')
                .delete()
                .eq('id', tripId);

            if (error) throw error;

            set(state => ({
                trips: state.trips.filter(trip => trip.id !== tripId),
                currentTrip: state.currentTrip?.id === tripId ? null : state.currentTrip,
                isLoading: false,
            }));
        } catch (error) {
            console.error('Error deleting trip:', error);
            set({ error: error.message, isLoading: false });
        }
    },

    // ── Pin ──────────────────────────────────────────────────────────
    togglePinTrip: async (tripId) => {
        const trip = get().trips.find(t => t.id === tripId);
        if (!trip) return;

        const newPinnedStatus = !trip.pinned;

        // Optimistic update
        set(state => ({
            trips: state.trips.map(t =>
                t.id === tripId ? { ...t, pinned: newPinnedStatus } : t
            ),
        }));

        try {
            const { error } = await supabase
                .from('trips')
                .update({ pinned: newPinnedStatus })
                .eq('id', tripId);

            if (error) {
                set(state => ({
                    trips: state.trips.map(t =>
                        t.id === tripId ? { ...t, pinned: !newPinnedStatus } : t
                    ),
                }));
                throw error;
            }
        } catch (error) {
            console.error('Error pinning trip:', error);
        }
    },

    setCurrentTrip: (tripId) => {
        const trip = get().trips.find(t => t.id === tripId);
        set({ currentTrip: trip || null });
    },

    // ── Update Trip metadata ─────────────────────────────────────────
    updateTrip: async (tripId, updates) => {
        try {
            const { data, error } = await supabase
                .from('trips')
                .update(updates)
                .eq('id', tripId)
                .select();

            if (error) {
                console.error('Supabase updateTrip error:', error.message, error.details, error.hint);
                throw error;
            }

            set(state => ({
                trips: state.trips.map(t =>
                    t.id === tripId ? { ...t, ...updates } : t
                ),
                currentTrip: state.currentTrip?.id === tripId
                    ? { ...state.currentTrip, ...updates }
                    : state.currentTrip,
            }));
        } catch (error) {
            console.error('Error updating trip:', error);
            set({ error: error.message });
        }
    },

    // ── LEGACY: updateTripDays (kept for backward compat during transition) ──
    updateTripDays: async (tripId, newDays) => {
        // Optimistic update of local state only (virtual days)
        set(state => ({
            trips: state.trips.map(t => t.id === tripId ? { ...t, days: newDays } : t),
            currentTrip: state.currentTrip?.id === tripId
                ? { ...state.currentTrip, days: newDays }
                : state.currentTrip,
        }));
    },

    // ── Add Activity (writes to trip_segments) ───────────────────────
    addActivity: async (tripId, dayId, activity) => {
        const store = get();
        const trip = store.trips.find(t => t.id === tripId);
        if (!trip) return;

        // Extract day number from dayId ("day-3" → 3)
        const dayNumber = parseInt(dayId.replace('day-', ''), 10);
        const day = trip.days?.find(d => d.id === dayId);

        // Determine next order_index
        const maxOrder = (day?.activities || []).reduce(
            (max, a, i) => Math.max(max, i), -1
        );

        // Determine segment type: 'gem' for hidden gems (Rule 7), else 'activity'
        const segType = activity.segmentType || 'activity';
        const estimatedCost = parseFloat(activity.estimated_cost) || 0;

        // ── Rule 5: Strict Budget Guard ──────────────────────────────
        if (segType !== 'gem') { // Gems excluded from budget (Rule 7)
            const budgetCheck = await checkStrictBudget(tripId, estimatedCost);
            if (!budgetCheck.allowed) {
                throw new Error(budgetCheck.message);
            }
        }

        const segmentRow = {
            trip_id: tripId,
            type: segType,
            title: activity.title,
            day_number: dayNumber,
            location: activity.location || day?.location || null,
            estimated_cost: estimatedCost,
            order_index: maxOrder + 1,
            metadata: {
                time: activity.time || '09:00',
                activityType: activity.type || 'sightseeing',
                notes: activity.notes || '',
                safety_warning: activity.safety_warning || null,
                isCompleted: false,
                rating: 0,
            },
        };

        const { data: inserted, error } = await supabase
            .from('trip_segments')
            .insert([segmentRow])
            .select()
            .single();

        if (error) {
            console.error('Error adding activity segment:', error);
            return;
        }

        // Remove placeholder for this day if it exists
        await supabase
            .from('trip_segments')
            .delete()
            .eq('trip_id', tripId)
            .eq('day_number', dayNumber)
            .eq('title', '__placeholder__');

        // Build new activity object
        const newActivity = {
            id: inserted.id,
            title: activity.title,
            time: activity.time || '09:00',
            type: activity.type || 'sightseeing',
            location: activity.location || day?.location || '',
            notes: activity.notes || '',
            estimated_cost: parseFloat(activity.estimated_cost) || 0,
            safety_warning: activity.safety_warning || null,
            isCompleted: false,
            rating: 0,
        };

        // Redistribute all activities (including new one) evenly across the day
        const allActivities = [...(day?.activities || []), newActivity];
        const redistributed = await redistributeTimes(allActivities);

        // Optimistic UI update with redistributed times
        set(state => ({
            trips: state.trips.map(t => {
                if (t.id !== tripId) return t;
                return {
                    ...t,
                    days: t.days.map(d => {
                        if (d.id !== dayId) return d;
                        return { ...d, activities: redistributed };
                    }),
                };
            }),
        }));
    },

    // ── Full Lifecycle Generation (Orchestrator) ─────────────────────
    generateFullItinerary: async (tripId) => {
        const store = get();
        const trip = store.trips.find(t => t.id === tripId);
        if (!trip) throw new Error('Trip not found');

        // Reset orchestration state
        set({
            allocation: null,
            dailySummary: [],
            bookingOptions: {},
            hiddenGems: [],
            orchestrationPhase: 'Starting',
        });

        // Run the 10-phase orchestrator
        const result = await orchestrateTrip(trip, {
            onPhase: (num, name) => {
                set({ orchestrationPhase: `Phase ${num}: ${name}` });
            },
        });

        // Clear all existing segments for this trip
        await supabase
            .from('trip_segments')
            .delete()
            .eq('trip_id', tripId);

        // Bulk-insert ALL segments from orchestrator
        // Embed lat/lng into metadata (so they survive DB round-trip) then strip top-level
        const dbSegments = result.segments.map(({ latitude, longitude, ...rest }) => {
            if (latitude != null || longitude != null) {
                rest.metadata = { ...rest.metadata, latitude, longitude };
            }
            return rest;
        });
        const { data: inserted, error } = await supabase
            .from('trip_segments')
            .insert(dbSegments)
            .select();

        if (error) {
            console.error('Error inserting orchestrated segments:', error);
            set({ orchestrationPhase: null });
            throw error;
        }

        // Rebuild virtual days from inserted segments
        const rebuiltDays = buildDaysFromSegments(inserted || [], trip);

        // Fix Group 4: Generate booking suggestions post-insert using real DB UUIDs
        const currency = trip.currency || 'USD';
        const currencyRate = CURRENCY_MULTIPLIERS[currency] || 1;
        const isLuxury = (trip.accommodation_preference || 'mid-range') === 'luxury';
        const upgradePool = result.allocation?.upgrade_pool || 0;

        const bookingOptions = generateAllBookingSuggestions(
            inserted || [],
            currencyRate,
            { isLuxury, upgradePool }
        );

        // Update store with full lifecycle output
        set(state => ({
            trips: state.trips.map(t =>
                t.id === tripId ? { ...t, days: rebuiltDays, _hasSegments: true } : t
            ),
            allocation: result.allocation,
            reconciliation: result.reconciliation,
            dailySummary: result.daily_summary,
            bookingOptions: bookingOptions,
            hiddenGems: result.hidden_gems,
            orchestrationPhase: null,
        }));

        return { ...result, booking_options: bookingOptions };
    },

    // ── Batch Add Activities (legacy — used for manual adds) ──────────
    batchAddActivities: async (tripId, activitiesByDay) => {
        const store = get();
        const trip = store.trips.find(t => t.id === tripId);
        if (!trip) return;

        // Delete all existing segments for this trip
        await supabase
            .from('trip_segments')
            .delete()
            .eq('trip_id', tripId);

        // Build all segment rows
        const rows = [];
        const totalDays = trip.days?.length || 0;

        activitiesByDay.forEach((dayActivities, dayIndex) => {
            const dayNumber = dayIndex + 1;
            const dayLocation = trip.days?.[dayIndex]?.location || trip.destination;

            if (!dayActivities || dayActivities.length === 0) {
                rows.push({
                    trip_id: tripId,
                    type: 'activity',
                    title: '__placeholder__',
                    day_number: dayNumber,
                    location: dayLocation,
                    estimated_cost: 0,
                    order_index: 0,
                    metadata: { placeholder: true },
                });
            } else {
                dayActivities.forEach((act, idx) => {
                    rows.push({
                        trip_id: tripId,
                        type: 'activity',
                        title: act.title,
                        day_number: dayNumber,
                        location: act.location || dayLocation,
                        estimated_cost: parseFloat(act.estimated_cost) || 0,
                        order_index: idx,
                        metadata: {
                            time: act.time || '09:00',
                            activityType: act.type || 'sightseeing',
                            notes: act.notes || '',
                            safety_warning: act.safety_warning || null,
                            isCompleted: false,
                            rating: 0,
                        },
                    });
                });
            }
        });

        // Placeholders for uncovered days
        const coveredDays = new Set(activitiesByDay.map((_, i) => i + 1));
        for (let d = 1; d <= totalDays; d++) {
            if (!coveredDays.has(d)) {
                const dayLocation = trip.days?.[d - 1]?.location || trip.destination;
                rows.push({
                    trip_id: tripId,
                    type: 'activity',
                    title: '__placeholder__',
                    day_number: d,
                    location: dayLocation,
                    estimated_cost: 0,
                    order_index: 0,
                    metadata: { placeholder: true },
                });
            }
        }

        const { data: inserted, error } = await supabase
            .from('trip_segments')
            .insert(rows)
            .select();

        if (error) {
            console.error('Error batch-inserting segments:', error);
            return;
        }

        // Generate transport/accommodation via legacy engine
        const transportSegs = generateTransportSegments(trip);
        let allInserted = inserted || [];

        if (transportSegs.length > 0) {
            const { data: transportInserted, error: tErr } = await supabase
                .from('trip_segments')
                .insert(transportSegs)
                .select();

            if (!tErr && transportInserted) {
                allInserted = [...allInserted, ...transportInserted];
            }
        }

        const rebuiltDays = buildDaysFromSegments(allInserted, trip);
        set(state => ({
            trips: state.trips.map(t =>
                t.id === tripId ? { ...t, days: rebuiltDays, _hasSegments: true } : t
            ),
        }));
    },

    // ── Delete Activity ──────────────────────────────────────────────
    deleteActivity: async (tripId, dayId, activityId) => {
        // activityId is now the segment UUID
        const { error } = await supabase
            .from('trip_segments')
            .delete()
            .eq('id', activityId);

        if (error) {
            console.error('Error deleting activity segment:', error);
            return;
        }

        // Get remaining activities and redistribute times
        const store = get();
        const trip = store.trips.find(t => t.id === tripId);
        const day = trip?.days?.find(d => d.id === dayId);
        const remaining = (day?.activities || []).filter(a => a.id !== activityId);
        const redistributed = await redistributeTimes(remaining);

        // Optimistic UI update with redistributed times
        set(state => ({
            trips: state.trips.map(t => {
                if (t.id !== tripId) return t;
                return {
                    ...t,
                    days: t.days.map(d => {
                        if (d.id !== dayId) return d;
                        return {
                            ...d,
                            activities: redistributed,
                        };
                    }),
                };
            }),
        }));
    },

    // ── Toggle Complete ──────────────────────────────────────────────
    toggleActivityComplete: async (tripId, dayId, activityId) => {
        const store = get();
        const trip = store.trips.find(t => t.id === tripId);
        if (!trip) return;

        const day = trip.days?.find(d => d.id === dayId);
        const activity = day?.activities?.find(a => a.id === activityId);
        if (!activity) return;

        const newCompleted = !activity.isCompleted;

        // Optimistic update
        set(state => ({
            trips: state.trips.map(t => {
                if (t.id !== tripId) return t;
                return {
                    ...t,
                    days: t.days.map(d => {
                        if (d.id !== dayId) return d;
                        return {
                            ...d,
                            activities: d.activities.map(a =>
                                a.id === activityId ? { ...a, isCompleted: newCompleted } : a
                            ),
                        };
                    }),
                };
            }),
        }));

        // Fetch current metadata, merge, update
        const { data: seg } = await supabase
            .from('trip_segments')
            .select('metadata')
            .eq('id', activityId)
            .single();

        await supabase
            .from('trip_segments')
            .update({ metadata: { ...(seg?.metadata || {}), isCompleted: newCompleted } })
            .eq('id', activityId);
    },

    // ── Update Activity Time ─────────────────────────────────────────
    updateActivityTime: async (tripId, dayId, activityId, newTime) => {
        // Optimistic update
        set(state => ({
            trips: state.trips.map(t => {
                if (t.id !== tripId) return t;
                return {
                    ...t,
                    days: t.days.map(d => {
                        if (d.id !== dayId) return d;
                        return {
                            ...d,
                            activities: d.activities.map(a =>
                                a.id === activityId ? { ...a, time: newTime } : a
                            ),
                        };
                    }),
                };
            }),
        }));

        // Fetch current metadata, merge, update
        const { data: seg } = await supabase
            .from('trip_segments')
            .select('metadata')
            .eq('id', activityId)
            .single();

        await supabase
            .from('trip_segments')
            .update({ metadata: { ...(seg?.metadata || {}), time: newTime } })
            .eq('id', activityId);
    },

    // ── Reorder Activities (LOCAL ONLY — no DB write) ──────────────────
    reorderActivities: (tripId, dayId, newActivities) => {
        const store = get();
        const trip = store.trips.find(t => t.id === tripId);
        const day = trip?.days?.find(d => d.id === dayId);

        // Capture the original time slots in positional order
        const originalTimes = (day?.activities || []).map(a => a.time || '09:00');

        // Assign original time slots to the new ordering
        const reorderedWithTimes = newActivities.map((act, idx) => ({
            ...act,
            time: originalTimes[idx] || act.time,
        }));

        // Local-only UI update — NOT persisted until persistReorder is called
        set(state => ({
            trips: state.trips.map(t => {
                if (t.id !== tripId) return t;
                return {
                    ...t,
                    days: t.days.map(d =>
                        d.id === dayId ? { ...d, activities: reorderedWithTimes } : d
                    ),
                };
            }),
        }));
    },

    // ── Persist Reorder to DB (called on explicit Save) ──────────────
    persistReorder: async (tripId) => {
        const store = get();
        const trip = store.trips.find(t => t.id === tripId);
        if (!trip?.days) return;

        const updates = [];
        for (const day of trip.days) {
            for (let idx = 0; idx < (day.activities || []).length; idx++) {
                const act = day.activities[idx];
                updates.push(
                    supabase
                        .from('trip_segments')
                        .select('metadata')
                        .eq('id', act.id)
                        .single()
                        .then(({ data: seg }) =>
                            supabase
                                .from('trip_segments')
                                .update({
                                    order_index: idx,
                                    metadata: { ...(seg?.metadata || {}), time: act.time },
                                })
                                .eq('id', act.id)
                        )
                );
            }
        }
        await Promise.all(updates);
    },

    // ── Rate Activity ────────────────────────────────────────────────
    rateActivity: async (tripId, dayId, activityId, rating) => {
        // Optimistic update
        set(state => ({
            trips: state.trips.map(t => {
                if (t.id !== tripId) return t;
                return {
                    ...t,
                    days: t.days.map(d => {
                        if (d.id !== dayId) return d;
                        return {
                            ...d,
                            activities: d.activities.map(a =>
                                a.id === activityId ? { ...a, rating } : a
                            ),
                        };
                    }),
                };
            }),
        }));

        const { data: seg } = await supabase
            .from('trip_segments')
            .select('metadata')
            .eq('id', activityId)
            .single();

        await supabase
            .from('trip_segments')
            .update({ metadata: { ...(seg?.metadata || {}), rating } })
            .eq('id', activityId);
    },
}));

export default useItineraryStore;
