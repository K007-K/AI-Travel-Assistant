/**
 * Trip Duration Planner — STRICT REALISTIC MODE
 *
 * Deterministic feasibility check for trip duration.
 * Uses OSRM for real driving times (async), falls back to tier estimate.
 *
 * NO AI calls. Pure math + real route data.
 *
 * @module engine/tripDurationPlanner
 */

import { getRouteTime } from '../api/routeTime.js';

// ── Main Entry ───────────────────────────────────────────────────────

/**
 * @param {object} params
 * @param {string} params.startLocation
 * @param {string} [params.returnLocation]
 * @param {Array<{location: string, days: number}>} params.destinations
 * @param {number} params.requestedDays
 * @returns {Promise<object>} Feasibility result
 */
export async function planTripDuration({
    startLocation,
    returnLocation,
    destinations,
    requestedDays,
}) {
    if (!destinations || destinations.length === 0) {
        return { feasible: true, requestedDays, suggestedDays: requestedDays, travelDaysRequired: 0, explorationDays: requestedDays, segments: [], reason: null };
    }

    const returnLoc = returnLocation || startLocation;

    // 1. Same-city check: single destination, same as start
    if (destinations.length === 1 &&
        startLocation.toLowerCase().trim() === destinations[0].location.toLowerCase().trim()) {
        const expDays = destinations[0].days || 1;
        return { feasible: true, requestedDays, suggestedDays: requestedDays, travelDaysRequired: 0, explorationDays: expDays, segments: [], reason: null };
    }

    // 2. Build route: start → D1 → D2 → ... → return
    const route = [startLocation, ...destinations.map(d => d.location)];
    if (returnLoc) route.push(returnLoc);

    // 3. Fetch real driving times for each transit pair (parallel)
    const pairs = [];
    for (let i = 0; i < route.length - 1; i++) {
        const from = route[i], to = route[i + 1];
        if (from.toLowerCase().trim() === to.toLowerCase().trim()) continue;
        pairs.push({ from, to });
    }

    const routeResults = await Promise.all(
        pairs.map(async ({ from, to }) => {
            const result = await getRouteTime(from, to);
            return { from, to, ...result };
        })
    );

    // 4. Compute travel days: merge short segments (≤3h), ceil long ones
    let travelDaysRequired = 0;
    for (const seg of routeResults) {
        if (seg.hours > 3) {
            travelDaysRequired += Math.ceil(seg.hours / 6);
        }
        // ≤3h segments merge into explore day — no separate travel day
    }

    // 5. Exploration days = sum of requested per destination
    const explorationDays = destinations.reduce((sum, d) => sum + (d.days || 1), 0);

    // 6. Minimum required
    const minimumRequiredDays = explorationDays + travelDaysRequired;

    // 7. Feasibility
    const feasible = requestedDays >= minimumRequiredDays;
    const reason = feasible
        ? null
        : `Trip requires ${minimumRequiredDays} days (${explorationDays} exploration + ${travelDaysRequired} travel), but only ${requestedDays} requested.`;

    return {
        feasible,
        requestedDays,
        suggestedDays: feasible ? requestedDays : minimumRequiredDays,
        minimumRequiredDays,
        travelDaysRequired,
        explorationDays,
        segments: routeResults,
        reason,
    };
}
