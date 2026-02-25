/**
 * Trip Duration Planner — STRICT REALISTIC MODE
 *
 * Deterministic feasibility check for trip duration.
 * Estimates travel hours between destinations using transportEngine's
 * distance tiers, computes required travel days, and validates against
 * user-requested duration.
 *
 * NO AI calls. Pure math. Under 90 lines.
 *
 * @module engine/tripDurationPlanner
 */

import {
    _estimateDistanceTier as estimateDistanceTier,
} from '../utils/transportEngine.js';

// ── Tier → Hours mapping ─────────────────────────────────────────────

const TIER_HOURS = {
    local:     0.5,
    short:     5,
    medium:    8,
    long:      12,
};

// ── Main Entry ───────────────────────────────────────────────────────

/**
 * @param {object} params
 * @param {string} params.startLocation
 * @param {string} [params.returnLocation]
 * @param {Array<{location: string, days: number}>} params.destinations
 * @param {number} params.requestedDays
 * @returns {object} Feasibility result
 */
export function planTripDuration({
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

    // 3. Estimate hours for each transit pair
    const segments = [];
    for (let i = 0; i < route.length - 1; i++) {
        const from = route[i], to = route[i + 1];
        if (from.toLowerCase().trim() === to.toLowerCase().trim()) continue;
        const tier = estimateDistanceTier(from, to);
        const hours = TIER_HOURS[tier] || 6;
        segments.push({ from, to, tier, hours });
    }

    // 4. Compute travel days: merge short segments (≤3h), ceil long ones
    let travelDaysRequired = 0;
    for (const seg of segments) {
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
        segments,
        reason,
    };
}

// ── Test Exports ─────────────────────────────────────────────────────
export { TIER_HOURS as _TIER_HOURS };
