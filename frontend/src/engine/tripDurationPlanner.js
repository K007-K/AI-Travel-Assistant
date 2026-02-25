/**
 * Trip Duration Planner — STRICT REALISTIC MODE
 *
 * Deterministic feasibility check for trip duration.
 * Uses OSRM for real driving times (async), falls back to tier estimate.
 *
 * Travel day formula (realistic):
 *   ≤3h   → 0 travel days (merge into explore day)
 *   ≤12h  → 1 travel day (long day drive/bus/train)
 *   ≤24h  → 2 travel days
 *   >24h  → ceil(hours / 12)
 *
 * Overnight travel:
 *   Routes 6-16h for budget/mid tier → canOvernight = true
 *   If canOvernight → 0 travel days (travel at night, arrive morning)
 *
 * NO AI calls. Pure math + real route data.
 *
 * @module engine/tripDurationPlanner
 */

import { getRouteTime } from '../api/routeTime.js';

// ── Overnight eligibility ────────────────────────────────────────────

/**
 * Can this segment be covered overnight (bus/train)?
 * Indian intercity routes 6-16h almost always have overnight service.
 * High-budget travelers typically prefer flights → no overnight.
 */
function canTravelOvernight(hours, budgetTier) {
    if (budgetTier === 'high') return false; // luxury → prefer flights
    return hours >= 6 && hours <= 16;
}

// ── Travel days calculation ──────────────────────────────────────────

function computeTravelDays(hours, budgetTier) {
    // ≤3h → merge into explore day
    if (hours <= 3) return 0;

    // Overnight eligible → 0 travel days (sleep on bus/train)
    if (canTravelOvernight(hours, budgetTier)) return 0;

    // Daytime travel
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
 * @param {number} params.requestedDays
 * @param {string} [params.budgetTier] — 'low' | 'mid' | 'high'
 * @returns {Promise<object>} Feasibility result
 */
export async function planTripDuration({
    startLocation,
    returnLocation,
    destinations,
    requestedDays,
    budgetTier = 'mid',
}) {
    if (!destinations || destinations.length === 0) {
        return { feasible: true, requestedDays, suggestedDays: requestedDays, travelDaysRequired: 0, explorationDays: requestedDays, segments: [], reason: null };
    }

    const returnLoc = returnLocation || startLocation;

    // 1. Same-city check
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
            const overnight = canTravelOvernight(result.hours, budgetTier);
            const travelDays = computeTravelDays(result.hours, budgetTier);
            return { from, to, ...result, canOvernight: overnight, travelDays };
        })
    );

    // 4. Sum travel days
    const travelDaysRequired = routeResults.reduce((sum, seg) => sum + seg.travelDays, 0);

    // 5. Exploration days = sum of requested per destination
    const explorationDays = destinations.reduce((sum, d) => sum + (d.days || 1), 0);

    // 6. Minimum required
    const minimumRequiredDays = explorationDays + travelDaysRequired;

    // 7. Feasibility
    const feasible = requestedDays >= minimumRequiredDays;

    // 8. Overnight summary for UI
    const overnightSegments = routeResults.filter(s => s.canOvernight);
    const allOvernight = overnightSegments.length === routeResults.length && routeResults.length > 0;

    const reason = feasible
        ? (allOvernight
            ? `All travel is overnight — your ${explorationDays} exploration days are fully preserved.`
            : null)
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
        allOvernight,
        overnightCount: overnightSegments.length,
    };
}

// ── Exports for testing ──────────────────────────────────────────────
export { canTravelOvernight as _canTravelOvernight };
export { computeTravelDays as _computeTravelDays };
