/**
 * Travel Timeline Builder — Structural Day Segmentation
 *
 * Creates an ordered array of TRAVEL and EXPLORE day segments.
 * Uses OSRM real driving times (async). Does NOT generate activities.
 *
 * @module engine/travelTimelineBuilder
 */

import { getRouteTime } from '../api/routeTime.js';

// ── Main Entry ───────────────────────────────────────────────────────

/**
 * Build a structural timeline of TRAVEL and EXPLORE day segments.
 *
 * @param {object} params
 * @param {string} params.startLocation
 * @param {string} [params.returnLocation]
 * @param {Array<{location: string, days: number}>} params.destinations
 * @returns {Promise<Array<{day_number, type, location?, from?, to?, hours?, fullDay?, arrivalNextDay?}>>}
 */
export async function buildTravelTimeline({
    startLocation,
    returnLocation,
    destinations,
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

            if (hours > 3) {
                const travelDays = Math.ceil(hours / 6);
                for (let t = 0; t < travelDays; t++) {
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
                    });
                }
            }
            // ≤3h travel merges into first explore day — no separate day
        }

        // Insert EXPLORE segments for this destination
        for (let e = 0; e < (dest.days || 1); e++) {
            dayNum++;
            timeline.push({
                day_number: dayNum,
                type: 'EXPLORE',
                location: dest.location,
            });
        }
    }

    // Return travel segment
    const lastDest = destinations[destinations.length - 1]?.location;
    if (returnLoc && lastDest &&
        returnLoc.toLowerCase().trim() !== lastDest.toLowerCase().trim()) {
        const routeInfo = await getRouteTime(lastDest, returnLoc);
        const hours = routeInfo.hours;

        if (hours > 3) {
            const travelDays = Math.ceil(hours / 6);
            for (let t = 0; t < travelDays; t++) {
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
                });
            }
        }
    }

    return timeline;
}
