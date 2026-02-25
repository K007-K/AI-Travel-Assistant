/**
 * Travel Timeline Builder — Structural Day Segmentation
 *
 * Creates an ordered array of TRAVEL and EXPLORE day segments.
 * Uses OSRM real driving times (async). Does NOT generate activities.
 *
 * Travel day formula matches tripDurationPlanner:
 *   ≤3h + overnight-eligible → 0 travel days
 *   ≤12h non-overnight → 1 travel day
 *   ≤24h → 2 travel days
 *
 * @module engine/travelTimelineBuilder
 */

import { getRouteTime } from '../api/routeTime.js';

// ── Overnight eligibility (same logic as planner) ────────────────────

function canTravelOvernight(hours, budgetTier) {
    if (budgetTier === 'high') return false;
    return hours >= 6 && hours <= 16;
}

function computeTravelDays(hours, budgetTier) {
    if (hours <= 3) return 0;
    if (canTravelOvernight(hours, budgetTier)) return 0;
    if (hours <= 12) return 1;
    if (hours <= 24) return 2;
    return Math.ceil(hours / 12);
}

// ── Main Entry ───────────────────────────────────────────────────────

/**
 * @param {object} params
 * @param {string} params.startLocation
 * @param {string} [params.returnLocation]
 * @param {Array<{location: string, days: number}>} params.destinations
 * @param {string} [params.budgetTier] — 'low' | 'mid' | 'high'
 * @returns {Promise<Array>}
 */
export async function buildTravelTimeline({
    startLocation,
    returnLocation,
    destinations,
    budgetTier = 'mid',
}) {
    if (!destinations || destinations.length === 0) return [];

    const returnLoc = returnLocation || startLocation;
    const timeline = [];
    let dayNum = 0;

    for (let i = 0; i < destinations.length; i++) {
        const dest = destinations[i];
        const from = i === 0 ? startLocation : destinations[i - 1].location;
        const to = dest.location;

        // Insert TRAVEL segment if different city
        if (from.toLowerCase().trim() !== to.toLowerCase().trim()) {
            const routeInfo = await getRouteTime(from, to);
            const hours = routeInfo.hours;
            const overnight = canTravelOvernight(hours, budgetTier);
            const travelDayCount = computeTravelDays(hours, budgetTier);

            if (travelDayCount > 0) {
                // Non-overnight: insert full travel days
                for (let t = 0; t < travelDayCount; t++) {
                    dayNum++;
                    timeline.push({
                        day_number: dayNum,
                        type: 'TRAVEL',
                        from,
                        to,
                        hours,
                        distanceKm: routeInfo.distanceKm,
                        source: routeInfo.source,
                        fullDay: true,
                        arrivalNextDay: hours > 10,
                        canOvernight: overnight,
                    });
                }
            }
            // If travelDayCount === 0 (merged or overnight), no TRAVEL day inserted.
            // Overnight travel info is attached to the first explore day below.
        }

        // Insert EXPLORE segments for this destination
        for (let e = 0; e < (dest.days || 1); e++) {
            dayNum++;
            const slot = {
                day_number: dayNum,
                type: 'EXPLORE',
                location: dest.location,
            };

            // Attach overnight travel info to first explore day of this dest
            if (e === 0) {
                const from2 = i === 0 ? startLocation : destinations[i - 1].location;
                if (from2.toLowerCase().trim() !== dest.location.toLowerCase().trim()) {
                    const routeInfo = await getRouteTime(from2, dest.location);
                    const overnight = canTravelOvernight(routeInfo.hours, budgetTier);
                    if (overnight) {
                        slot.overnightArrival = {
                            from: from2,
                            hours: routeInfo.hours,
                            distanceKm: routeInfo.distanceKm,
                        };
                    }
                }
            }

            timeline.push(slot);
        }
    }

    // Return travel segment
    const lastDest = destinations[destinations.length - 1]?.location;
    if (returnLoc && lastDest &&
        returnLoc.toLowerCase().trim() !== lastDest.toLowerCase().trim()) {
        const routeInfo = await getRouteTime(lastDest, returnLoc);
        const hours = routeInfo.hours;
        const overnight = canTravelOvernight(hours, budgetTier);
        const travelDayCount = computeTravelDays(hours, budgetTier);

        if (travelDayCount > 0) {
            for (let t = 0; t < travelDayCount; t++) {
                dayNum++;
                timeline.push({
                    day_number: dayNum,
                    type: 'TRAVEL',
                    from: lastDest,
                    to: returnLoc,
                    hours,
                    distanceKm: routeInfo.distanceKm,
                    source: routeInfo.source,
                    fullDay: true,
                    arrivalNextDay: hours > 10,
                    canOvernight: overnight,
                });
            }
        }
        // Overnight return — no extra day needed
    }

    return timeline;
}
