/**
 * Itinerary Helper Utilities
 *
 * Pure utility functions extracted from itineraryStore.
 * No state, no side effects — safe to import anywhere.
 */
import { supabase } from '../lib/supabase';

// ── Time Scheduling Utilities ────────────────────────────────────────

export function timeToMinutes(t) {
    const [h, m] = (t || '09:00').split(':').map(Number);
    return h * 60 + m;
}

export function minutesToTime(mins) {
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
export async function redistributeTimes(activities, dayStart = '08:00', dayEnd = '20:00', persist = true) {
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
                .catch(err => console.error('[Schedule] Failed to persist time:', err))
        );
        await Promise.all(updates);
    }

    // Return merged and sorted by time
    return [...logistics, ...schedulable].sort((a, b) =>
        timeToMinutes(a.time || '09:00') - timeToMinutes(b.time || '09:00')
    );
}

// ── Helpers ──────────────────────────────────────────────────────────

/** Map a trip_segment row's type to a UI-friendly activity type string */
export function segmentTypeToActivityType(seg) {
    if (seg.type === 'activity') return seg.metadata?.activityType || 'sightseeing';
    if (seg.type === 'gem') return 'gem';
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
export function buildDaysFromSegments(segments, trip) {
    if (!segments || segments.length === 0) return [];

    // Exclude meta-segments (persisted separately, not visible in itinerary)
    const daySegments = segments.filter(seg => seg.type !== 'hidden_gem' && seg.type !== 'allocation');

    const byDay = {};
    daySegments.forEach(seg => {
        const dn = seg.day_number;
        if (!byDay[dn]) byDay[dn] = [];
        byDay[dn].push(seg);
    });

    const tripSegments = trip.segments || [];

    const dayNumbers = Object.keys(byDay).map(Number).sort((a, b) => a - b);
    return dayNumbers.map(dn => {
        const segs = byDay[dn].sort((a, b) => {
            // Logistics segments (outbound, return, intercity, local transport) use order_index
            const aIsLogistics = ['outbound_travel', 'return_travel', 'intercity_travel', 'local_transport', 'accommodation'].includes(a.type);
            const bIsLogistics = ['outbound_travel', 'return_travel', 'intercity_travel', 'local_transport', 'accommodation'].includes(b.type);

            // If both are normal activities, sort by time
            if (!aIsLogistics && !bIsLogistics) {
                const timeA = a.metadata?.time || '09:00';
                const timeB = b.metadata?.time || '09:00';
                return timeA.localeCompare(timeB);
            }
            // Logistics keep order_index priority
            return (a.order_index ?? 0) - (b.order_index ?? 0);
        });
        const dayLocation = segs.find(s => s.location)?.location
            || getDayLocationFromTripSegments(tripSegments, dn)
            || trip.destination;

        return {
            id: `day-${dn}`,
            dayNumber: dn,
            location: dayLocation,
            activities: segs.map(seg => ({
                id: seg.id,
                title: seg.title,
                time: seg.start_time ? new Date(seg.start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : (seg.metadata?.time || '09:00'),
                type: segmentTypeToActivityType(seg),
                location: seg.location || dayLocation,
                notes: seg.metadata?.notes || '',
                estimated_cost: parseFloat(seg.estimated_cost) || 0,
                safety_warning: seg.metadata?.safety_warning || null,
                isCompleted: seg.metadata?.isCompleted || false,
                rating: seg.metadata?.rating || 0,
                order_index: seg.order_index ?? 0,
                latitude: seg.latitude || seg.metadata?.latitude || null,
                longitude: seg.longitude || seg.metadata?.longitude || null,
                segmentType: seg.type,
                transportMode: seg.metadata?.transport_mode || null,
                isLogistics: ['outbound_travel', 'return_travel', 'intercity_travel', 'local_transport', 'accommodation'].includes(seg.type),
                isGem: seg.type === 'gem',
            }))
        };
    });
}

/** Look up which location a day belongs to based on the trip's multi-city segments config */
export function getDayLocationFromTripSegments(tripSegments, dayNumber) {
    let cumulative = 0;
    for (const seg of tripSegments) {
        cumulative += (seg.days || 0);
        if (dayNumber <= cumulative) return seg.location;
    }
    return null;
}
