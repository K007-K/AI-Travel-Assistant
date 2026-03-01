/**
 * Trip Store — All trip data and segment operations.
 *
 * Owns: trips[], currentTrip, CRUD operations, segment/activity operations.
 * Does NOT own: generation lifecycle (that's itineraryStore).
 */
import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { buildDaysFromSegments, redistributeTimes } from '../utils/itineraryHelpers';

const useTripStore = create((set, get) => ({
    trips: [],
    currentTrip: null,
    isLoading: false,
    error: null,

    // ═══════════════════════════════════════════════════════════════════
    // ── TRIP CRUD ─────────────────────────────────────────────────────
    // ═══════════════════════════════════════════════════════════════════

    fetchTrips: async () => {
        set({ isLoading: true, error: null });
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                set({ isLoading: false, trips: [] });
                return;
            }

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
                    return {
                        ...trip,
                        days: buildDaysFromSegments(tripSegs, trip),
                        _hasSegments: true,
                    };
                } else {
                    return { ...trip, days: [], _hasSegments: false };
                }
            });

            set({ trips: enrichedTrips, isLoading: false });
        } catch (error) {
            console.error('Error fetching trips:', error);
            set({ error: error.message, isLoading: false });
        }
    },

    ensureSegments: async (tripId) => {
        const store = get();
        const trip = store.trips.find(t => t.id === tripId);
        if (!trip || trip._hasSegments) return;
    },

    createTrip: async (tripData) => {
        set({ isLoading: true, error: null });
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const segments = tripData.segments || [
                { location: tripData.destination, days: tripData.duration }
            ];

            const _totalDays = segments.reduce((sum, s) => sum + (s.days || 0), 0);

            // Map new user-facing styles → old DB-compatible values
            // DB CHECK constraint (trips_travel_style_check) only allows original names
            const STYLE_TO_DB = {
                relax: 'luxury_escape',
                explore: 'city_exploration',
                adventure: 'road_trip',
                business: 'business_travel',
            };
            const dbStyle = STYLE_TO_DB[tripData.travel_style] || tripData.travel_style || null;

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
                start_location: tripData.start_location || null,
                return_location: tripData.return_location || null,
                travel_style: dbStyle,
                // DB CHECK constraints only allow specific values — send safe defaults
                own_vehicle_type: (tripData.own_vehicle_type && tripData.own_vehicle_type !== 'auto')
                    ? tripData.own_vehicle_type : 'none',
                travel_preference: (tripData.travel_preference && tripData.travel_preference !== 'auto')
                    ? tripData.travel_preference : 'any',
                accommodation_preference: tripData.accommodation_preference || 'mid-range',
            };

            const { data, error } = await supabase
                .from('trips')
                .insert([newTrip])
                .select()
                .single();

            if (error) throw error;

            // Attach engine-only values client-side (not persisted to DB)
            data.budget_tier = tripData.budget_tier || null;
            data.travel_style = tripData.travel_style || data.travel_style;
            data.own_vehicle_type = tripData.own_vehicle_type || 'auto';
            data.travel_preference = tripData.travel_preference || 'auto';

            // Create placeholder segments for each day
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

            // Build virtual days array
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

    deleteTrip: async (tripId) => {
        set({ isLoading: true, error: null });
        try {
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

    togglePinTrip: async (tripId) => {
        const trip = get().trips.find(t => t.id === tripId);
        if (!trip) return;

        const newPinnedStatus = !trip.pinned;

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

    updateTrip: async (tripId, updates) => {
        try {
            const { data: _data, error } = await supabase
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

    updateTripDays: async (tripId, newDays) => {
        set(state => ({
            trips: state.trips.map(t => t.id === tripId ? { ...t, days: newDays } : t),
            currentTrip: state.currentTrip?.id === tripId
                ? { ...state.currentTrip, days: newDays }
                : state.currentTrip,
        }));
    },

    // ═══════════════════════════════════════════════════════════════════
    // ── SEGMENT / ACTIVITY OPERATIONS ─────────────────────────────────
    // ═══════════════════════════════════════════════════════════════════

    addActivity: async (tripId, dayId, activity) => {
        const store = get();
        const trip = store.trips.find(t => t.id === tripId);
        if (!trip) return;

        const dayNumber = parseInt(dayId.replace('day-', ''), 10);
        const day = trip.days?.find(d => d.id === dayId);

        const maxOrder = (day?.activities || []).reduce(
            (max, _a, i) => Math.max(max, i), -1
        );

        const segType = activity.segmentType || 'activity';
        const estimatedCost = parseFloat(activity.estimated_cost) || 0;

        if (segType !== 'gem') {
            // Simple budget check: sum existing segments + new cost vs budget
            const { data: existingSegs } = await supabase
                .from('trip_segments')
                .select('estimated_cost')
                .eq('trip_id', tripId);
            const currentTotal = (existingSegs || []).reduce((s, seg) => s + (seg.estimated_cost || 0), 0);
            if (trip.budget && (currentTotal + estimatedCost) > trip.budget) {
                throw new Error(`Adding this would exceed your budget (${currentTotal + estimatedCost} > ${trip.budget})`);
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

        await supabase
            .from('trip_segments')
            .delete()
            .eq('trip_id', tripId)
            .eq('day_number', dayNumber)
            .eq('title', '__placeholder__');

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

        const allActivities = [...(day?.activities || []), newActivity];
        const redistributed = await redistributeTimes(allActivities);

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

    batchAddActivities: async (tripId, activitiesByDay) => {
        const store = get();
        const trip = store.trips.find(t => t.id === tripId);
        if (!trip) return;

        await supabase
            .from('trip_segments')
            .delete()
            .eq('trip_id', tripId);

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

        // Transport segments are now generated by the LLM via orchestrateTrip()
        const allInserted = inserted || [];

        const rebuiltDays = buildDaysFromSegments(allInserted, trip);
        set(state => ({
            trips: state.trips.map(t =>
                t.id === tripId ? { ...t, days: rebuiltDays, _hasSegments: true } : t
            ),
        }));
    },

    deleteActivity: async (tripId, dayId, activityId) => {
        const { error } = await supabase
            .from('trip_segments')
            .delete()
            .eq('id', activityId);

        if (error) {
            console.error('Error deleting activity segment:', error);
            return;
        }

        const store = get();
        const trip = store.trips.find(t => t.id === tripId);
        const day = trip?.days?.find(d => d.id === dayId);
        const remaining = (day?.activities || []).filter(a => a.id !== activityId);
        const redistributed = await redistributeTimes(remaining);

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

    toggleActivityComplete: async (tripId, dayId, activityId) => {
        const store = get();
        const trip = store.trips.find(t => t.id === tripId);
        if (!trip) return;

        const day = trip.days?.find(d => d.id === dayId);
        const activity = day?.activities?.find(a => a.id === activityId);
        if (!activity) return;

        const newCompleted = !activity.isCompleted;

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

    updateActivityTime: async (tripId, dayId, activityId, newTime) => {
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

    reorderActivities: (tripId, dayId, newActivities) => {
        const store = get();
        const trip = store.trips.find(t => t.id === tripId);
        const day = trip?.days?.find(d => d.id === dayId);

        const originalTimes = (day?.activities || []).map(a => a.time || '09:00');
        const reorderedWithTimes = newActivities.map((act, idx) => ({
            ...act,
            time: originalTimes[idx] || act.time,
        }));

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
                        .catch(err => console.error('[Reorder] Failed to persist order:', err))
                );
            }
        }
        await Promise.all(updates);
    },

    rateActivity: async (tripId, dayId, activityId, rating) => {
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

export default useTripStore;
