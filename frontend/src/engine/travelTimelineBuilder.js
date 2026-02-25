/**
 * Travel Timeline Builder — Structural Day Segmentation
 *
 * Creates an ordered array of TRAVEL and EXPLORE day segments.
 * Does NOT generate activities — only structural slots.
 * The orchestrator uses this to call LLM only for EXPLORE days.
 *
 * @module engine/travelTimelineBuilder
 */

import {
    _estimateDistanceTier as estimateDistanceTier,
} from '../utils/transportEngine.js';

// ── Same tier→hours mapping as planner ───────────────────────────────

const TIER_HOURS = {
    local:     0.5,
    short:     5,
    medium:    8,
    long:      12,
};

// ── Main Entry ───────────────────────────────────────────────────────

/**
 * Build a structural timeline of TRAVEL and EXPLORE day segments.
 *
 * @param {object} params
 * @param {string} params.startLocation
 * @param {string} [params.returnLocation]
 * @param {Array<{location: string, days: number}>} params.destinations
 * @returns {Array<{day_number, type, location?, from?, to?, hours?, fullDay?, partialDay?, arrivalNextDay?}>}
 */
export function buildTravelTimeline({
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
            const tier = estimateDistanceTier(from, to);
            const hours = TIER_HOURS[tier] || 6;

            if (hours > 3) {
                // Full or multi-day travel
                const travelDays = Math.ceil(hours / 6);
                for (let t = 0; t < travelDays; t++) {
                    dayNum++;
                    timeline.push({
                        day_number: dayNum,
                        type: 'TRAVEL',
                        from,
                        to,
                        hours,
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
        const tier = estimateDistanceTier(lastDest, returnLoc);
        const hours = TIER_HOURS[tier] || 6;

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
                    fullDay: true,
                    arrivalNextDay: hours > 10,
                });
            }
        }
    }

    return timeline;
}
