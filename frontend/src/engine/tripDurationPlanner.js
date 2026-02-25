/**
 * Trip Duration Planner — Deterministic Feasibility Check
 *
 * Calculates whether the user's requested trip duration is physically
 * feasible given intercity distances between destinations.
 *
 * NO AI calls — pure distance/time math.
 * Runs BEFORE the orchestrator. If infeasible, the UI shows a
 * confirmation modal before proceeding.
 *
 * @module engine/tripDurationPlanner
 */

import {
    _estimateDistanceTier as estimateDistanceTier,
    _KM_ESTIMATES as KM_ESTIMATES,
    _estimateDrivingTime as estimateDrivingTime,
} from '../utils/transportEngine.js';

// ── Constants ────────────────────────────────────────────────────────

/** Hours of usable exploration time per day (08:00–21:00 minus buffers) */
const USABLE_HOURS_PER_DAY = 10;

/** Minimum exploration hours per day for a trip to feel worthwhile */
const STYLE_MIN_HOURS = {
    relaxation:    4,
    city_explorer: 5,
    adventure:     5,
    business:      3,
    road_trip:     3,
};

/** Hours of driving that consume one full travel day */
const HOURS_PER_TRAVEL_DAY = 6;

// ── Main Entry ───────────────────────────────────────────────────────

/**
 * Plan trip duration and check feasibility.
 *
 * @param {object} params
 * @param {string} params.startLocation — Origin city
 * @param {string} params.returnLocation — Return city (defaults to startLocation)
 * @param {Array<{location: string, days: number}>} params.destinations — Ordered destinations with requested days
 * @param {number} params.requestedDays — Total days the user requested
 * @param {string} [params.travelStyle='city_explorer'] — Travel style for min hours check
 * @returns {object} Feasibility result
 */
export function planTripDuration({
    startLocation,
    returnLocation,
    destinations,
    requestedDays,
    travelStyle = 'city_explorer',
}) {
    if (!destinations || destinations.length === 0) {
        return { feasible: true, requestedDays, suggestedDays: requestedDays, travelDays: 0, explorationDays: requestedDays, segments: [], issues: [] };
    }

    const returnLoc = returnLocation || startLocation;
    const issues = [];

    // Build the full route: start → dest1 → dest2 → ... → return
    const route = [startLocation, ...destinations.map(d => d.location)];
    if (returnLoc) route.push(returnLoc);

    // Calculate travel hours for each transit segment
    const segments = [];
    for (let i = 0; i < route.length - 1; i++) {
        const from = route[i];
        const to = route[i + 1];

        // Skip if same city
        if (from.toLowerCase().trim() === to.toLowerCase().trim()) continue;

        const distTier = estimateDistanceTier(from, to);
        const distKm = KM_ESTIMATES[distTier] || KM_ESTIMATES.short;
        const hours = estimateDrivingTime(distKm);

        segments.push({ from, to, distTier, distKm, hours });
    }

    // Total travel hours and travel days needed
    const totalTravelHours = segments.reduce((sum, s) => sum + s.hours, 0);
    const travelDays = segments.reduce((sum, s) => sum + Math.ceil(s.hours / HOURS_PER_TRAVEL_DAY), 0);

    // Total exploration days requested
    const explorationDays = destinations.reduce((sum, d) => sum + (d.days || 1), 0);

    // Minimum required days
    const minimumRequiredDays = explorationDays + travelDays;

    // Check remaining exploration quality per day
    const styleMinHours = STYLE_MIN_HOURS[travelStyle] || 5;

    // On days with partial travel (≤3h), check if remaining hours are enough
    for (const seg of segments) {
        if (seg.hours <= 3) {
            const remainingHours = USABLE_HOURS_PER_DAY - seg.hours;
            if (remainingHours < styleMinHours) {
                issues.push(`${seg.from}→${seg.to}: ${seg.hours.toFixed(1)}h travel leaves only ${remainingHours.toFixed(1)}h for exploration (need ${styleMinHours}h for ${travelStyle})`);
            }
        }
    }

    const feasible = requestedDays >= minimumRequiredDays && issues.length === 0;

    const suggestedDays = feasible ? requestedDays : minimumRequiredDays;

    // Build restructured day plan
    const restructuredPlan = buildRestructuredPlan(startLocation, returnLoc, destinations, segments);

    return {
        feasible,
        requestedDays,
        suggestedDays,
        travelDays,
        explorationDays,
        minimumRequiredDays,
        totalTravelHours: Math.round(totalTravelHours * 10) / 10,
        segments,
        restructuredPlan,
        issues,
    };
}

// ── Plan Builder ─────────────────────────────────────────────────────

/**
 * Build a day-by-day restructured plan showing TRAVEL vs EXPLORE days.
 */
function buildRestructuredPlan(startLocation, returnLocation, destinations, travelSegments) {
    const plan = [];
    let dayNum = 0;
    let segIdx = 0;

    for (let i = 0; i < destinations.length; i++) {
        const dest = destinations[i];
        const from = i === 0 ? startLocation : destinations[i - 1].location;
        const to = dest.location;

        // Travel day(s) to reach this destination
        if (from.toLowerCase().trim() !== to.toLowerCase().trim() && segIdx < travelSegments.length) {
            const seg = travelSegments[segIdx];
            const segTravelDays = Math.ceil(seg.hours / HOURS_PER_TRAVEL_DAY);

            for (let t = 0; t < segTravelDays; t++) {
                dayNum++;
                plan.push({ day_number: dayNum, type: 'TRAVEL', from: seg.from, to: seg.to });
            }
            segIdx++;
        }

        // Exploration days at destination
        for (let e = 0; e < (dest.days || 1); e++) {
            dayNum++;
            plan.push({ day_number: dayNum, type: 'EXPLORE', location: dest.location });
        }
    }

    // Return travel
    const lastDest = destinations[destinations.length - 1]?.location;
    if (returnLocation && lastDest &&
        returnLocation.toLowerCase().trim() !== lastDest.toLowerCase().trim() &&
        segIdx < travelSegments.length) {
        const seg = travelSegments[segIdx];
        const segTravelDays = Math.ceil(seg.hours / HOURS_PER_TRAVEL_DAY);

        for (let t = 0; t < segTravelDays; t++) {
            dayNum++;
            plan.push({ day_number: dayNum, type: 'TRAVEL', from: seg.from, to: seg.to });
        }
    }

    return plan;
}

// ── Test Exports ─────────────────────────────────────────────────────
export {
    USABLE_HOURS_PER_DAY as _USABLE_HOURS_PER_DAY,
    STYLE_MIN_HOURS as _STYLE_MIN_HOURS,
    HOURS_PER_TRAVEL_DAY as _HOURS_PER_TRAVEL_DAY,
    buildRestructuredPlan as _buildRestructuredPlan,
};
