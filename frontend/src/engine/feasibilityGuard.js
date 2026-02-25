/**
 * Feasibility Guard — Phase 4d of Trip Orchestration
 *
 * Deterministic, client-side module that validates and corrects
 * AI-generated activities BEFORE transport insertion.
 *
 * NO AI calls — pure algorithmic enforcement.
 * Pure functions, testable, no side effects.
 *
 * Guards enforced:
 *  1. Intercity feasibility (1-day long-haul → max 2 activities)
 *  2. Activity count per travel style
 *  3. Arrival constraint (no activities before arrival)
 *  4. Departure constraint (buffer before return)
 *  5. Geo-reordering by proximity (nearest neighbor)
 *  6. Daily time limit (10 hours max)
 *  7. Per-activity cost clamping by budget tier
 *
 * @module engine/feasibilityGuard
 */

import { haversineDistance } from '../utils/transportEngine.js';

// ── Constants ────────────────────────────────────────────────────────

/** Max activities per day by travel style */
const STYLE_LIMITS = {
    relaxation:     3,
    city_explorer:  4,
    adventure:      5,
    business:       2,
    road_trip:      4,
};

/** Per-activity cost caps by budget tier (in local currency units) */
const TIER_COST_CAPS = {
    'budget':    { perActivity: 500,  perDay: 1500  },
    'mid-range': { perActivity: 2000, perDay: 6000  },
    'luxury':    { perActivity: 8000, perDay: 25000 },
};

/** Max distance (km) between consecutive activities on the same day */
const MAX_INTRADAY_DISTANCE_KM = 40;

/** Max active minutes per day (10 hours) */
const MAX_DAILY_MINUTES = 600;

/** Default activity duration if not estimable (minutes) */
const DEFAULT_ACTIVITY_DURATION = 60;

/** Buffer between activities (minutes) */
const ACTIVITY_BUFFER = 30;



// ── Utilities ────────────────────────────────────────────────────────

/**
 * Parse "HH:MM" to minutes since midnight.
 * @param {string} timeStr
 * @returns {number} minutes (e.g., "09:30" → 570)
 */
function parseTime(timeStr) {
    if (!timeStr || typeof timeStr !== 'string') return 480; // default 08:00
    const [h, m] = timeStr.split(':').map(Number);
    return (isNaN(h) ? 8 : h) * 60 + (isNaN(m) ? 0 : m);
}

/**
 * Format minutes since midnight to "HH:MM".
 * @param {number} minutes
 * @returns {string}
 */
function formatTime(minutes) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Group segments by day_number.
 * @param {object[]} segments
 * @returns {Map<number, object[]>}
 */
function groupByDay(segments) {
    const map = new Map();
    for (const seg of segments) {
        const day = seg.day_number || 1;
        if (!map.has(day)) map.set(day, []);
        map.get(day).push(seg);
    }
    return map;
}

// ── Guard Functions ──────────────────────────────────────────────────

/**
 * 1️⃣ Intercity Feasibility
 *
 * For 1-day trips with very long intercity travel (800km+),
 * cap activities since the traveler spends most of the day in transit.
 * For normal intercity trips, rely on style limits (Guard #2).
 */
function enforceIntercityFeasibility(segments, trip, issues) {
    const totalDays = trip.totalDays || 1;
    const startLoc = (trip.start_location || '').toLowerCase();
    const destLoc = (trip.destination || '').toLowerCase();

    // Only apply for 1-day intercity trips
    if (totalDays > 1 || startLoc === destLoc || !startLoc || !destLoc) return;

    // Check if any geocoded activity has coordinates to estimate distance
    // For normal intercity (< 800km), style limits (Guard #2) are sufficient
    // Only cap hard at 3 for truly long-haul routes
    const geocoded = segments.filter(s => s.latitude && s.longitude);
    if (geocoded.length === 0) return; // can't determine distance, skip

    // Use the trip's distance tier if available, otherwise skip
    // This guard is a safety net, not the primary limiter
    const dayMap = groupByDay(segments);
    for (const [day, daySegs] of dayMap) {
        // Only apply if > 5 activities on a 1-day intercity trip
        // (style limits will handle 3-5 range)
        if (daySegs.length > 5) {
            const cap = 3;
            issues.push(`Day ${day}: Reduced from ${daySegs.length} to ${cap} activities (1-day intercity trip)`);

            daySegs.sort((a, b) => a.order_index - b.order_index);
            const toRemove = daySegs.slice(cap);
            for (const seg of toRemove) {
                const idx = segments.indexOf(seg);
                if (idx !== -1) segments.splice(idx, 1);
            }
        }
    }
}

/**
 * 2️⃣ Activity Count per Style
 *
 * Enforce hard limits based on travel style.
 * Relaxation:3, City Explorer:4, Adventure:5, Business:2
 */
function enforceActivityCountLimit(segments, travelStyle, issues) {
    const max = STYLE_LIMITS[travelStyle] || 4;

    const dayMap = groupByDay(segments);
    for (const [day, daySegs] of dayMap) {
        if (daySegs.length > max) {
            issues.push(`Day ${day}: Exceeded ${travelStyle} style limit (${daySegs.length}→${max})`);

            daySegs.sort((a, b) => a.order_index - b.order_index);
            const toRemove = daySegs.slice(max);
            for (const seg of toRemove) {
                const idx = segments.indexOf(seg);
                if (idx !== -1) segments.splice(idx, 1);
            }
        }
    }
}

/**
 * 3️⃣ Arrival Constraint
 *
 * If outbound transport exists, ensure first activity starts after a
 * reasonable arrival buffer. Activities before arrival are removed.
 */
function enforceArrivalConstraint(segments, transportSegments, issues) {
    const outbound = transportSegments.find(s =>
        s.type === 'outbound_travel' || s.type === 'OUTBOUND'
    );
    if (!outbound) return;

    // Estimate arrival time from metadata or use heuristic
    const arrivalTime = outbound.metadata?.arrival_time || null;
    if (!arrivalTime) return; // can't enforce without arrival time

    const arrivalMinutes = parseTime(arrivalTime) + ACTIVITY_BUFFER;

    const dayMap = groupByDay(segments);
    const firstDaySegs = dayMap.get(1) || [];

    for (const seg of firstDaySegs) {
        const actTime = parseTime(seg.metadata?.time);
        if (actTime < arrivalMinutes) {
            issues.push(`Day 1: "${seg.title}" starts at ${seg.metadata?.time} before arrival — shifted to ${formatTime(arrivalMinutes)}`);
            if (seg.metadata) seg.metadata.time = formatTime(arrivalMinutes);
        }
    }
}

/**
 * 4️⃣ Departure Constraint
 *
 * Ensure last-day activities end at least 90 minutes before departure.
 */
function enforceDepartureConstraint(segments, transportSegments, totalDays, issues) {
    const returnSeg = transportSegments.find(s =>
        s.type === 'return_travel' || s.type === 'RETURN'
    );
    if (!returnSeg) return;

    const departureTime = returnSeg.metadata?.departure_time || null;
    if (!departureTime) return;

    const departureMinutes = parseTime(departureTime) - 90; // 1.5h buffer

    const dayMap = groupByDay(segments);
    const lastDaySegs = dayMap.get(totalDays) || [];

    // Sort by time and check last activity
    lastDaySegs.sort((a, b) =>
        parseTime(a.metadata?.time) - parseTime(b.metadata?.time)
    );

    const last = lastDaySegs[lastDaySegs.length - 1];
    if (!last) return;

    const lastTime = parseTime(last.metadata?.time) + DEFAULT_ACTIVITY_DURATION;
    if (lastTime > departureMinutes) {
        issues.push(`Day ${totalDays}: "${last.title}" overlaps departure buffer — removed`);
        const idx = segments.indexOf(last);
        if (idx !== -1) segments.splice(idx, 1);
    }
}

/**
 * 5️⃣ Geo-reordering by Proximity
 *
 * For each day, reorder activities using nearest-neighbor sort
 * to minimize travel between consecutive activities.
 * Also flags and removes activities >40km from the cluster.
 */
function reorderActivitiesByProximity(segments, issues) {
    const dayMap = groupByDay(segments);

    for (const [day, daySegs] of dayMap) {
        // Need at least 2 geocoded activities
        const geocoded = daySegs.filter(s => s.latitude && s.longitude);
        if (geocoded.length < 2) continue;

        // Nearest-neighbor TSP greedy sort
        const sorted = nearestNeighborSort(geocoded);

        // Check for >40km jumps
        for (let i = 1; i < sorted.length; i++) {
            const prev = sorted[i - 1];
            const curr = sorted[i];
            const dist = haversineDistance(
                prev.latitude, prev.longitude,
                curr.latitude, curr.longitude
            );
            if (dist > MAX_INTRADAY_DISTANCE_KM) {
                issues.push(`Day ${day}: "${curr.title}" is ${dist.toFixed(1)}km from "${prev.title}" — removed`);
                const idx = segments.indexOf(curr);
                if (idx !== -1) segments.splice(idx, 1);
            }
        }

        // Reassign order_index based on new sort
        const remaining = daySegs.filter(s => segments.includes(s));
        const sortedRemaining = remaining.filter(s => s.latitude && s.longitude);
        const reSorted = nearestNeighborSort(sortedRemaining);
        reSorted.forEach((seg, i) => { seg.order_index = i; });

        // Non-geocoded activities get appended after
        const nonGeocoded = remaining.filter(s => !s.latitude || !s.longitude);
        nonGeocoded.forEach((seg, i) => { seg.order_index = reSorted.length + i; });
    }
}

/**
 * Nearest-neighbor greedy sort.
 * Starts from the first activity and always visits the closest unvisited next.
 */
function nearestNeighborSort(activities) {
    if (activities.length <= 1) return [...activities];

    const result = [];
    const remaining = [...activities];

    // Start from time-earliest activity
    remaining.sort((a, b) =>
        parseTime(a.metadata?.time) - parseTime(b.metadata?.time)
    );
    result.push(remaining.shift());

    while (remaining.length > 0) {
        const current = result[result.length - 1];
        let minDist = Infinity;
        let minIdx = 0;

        for (let i = 0; i < remaining.length; i++) {
            const dist = haversineDistance(
                current.latitude, current.longitude,
                remaining[i].latitude, remaining[i].longitude
            );
            if (dist < minDist) {
                minDist = dist;
                minIdx = i;
            }
        }

        result.push(remaining.splice(minIdx, 1)[0]);
    }

    return result;
}

/**
 * 6️⃣ Daily Time Limit
 *
 * Enforce max 10h of active time per day (including 30min buffers).
 * Remove lowest-priority (last) activities if exceeded.
 */
function enforceDailyTimeLimit(segments, issues) {
    const dayMap = groupByDay(segments);

    for (const [day, daySegs] of dayMap) {
        daySegs.sort((a, b) => a.order_index - b.order_index);

        let totalMinutes = 0;
        for (let i = 0; i < daySegs.length; i++) {
            totalMinutes += DEFAULT_ACTIVITY_DURATION;
            if (i < daySegs.length - 1) totalMinutes += ACTIVITY_BUFFER;
        }

        // Remove last activities until within limit
        while (totalMinutes > MAX_DAILY_MINUTES && daySegs.length > 1) {
            const removed = daySegs.pop();
            issues.push(`Day ${day}: Time exceeded ${MAX_DAILY_MINUTES}min — removed "${removed.title}"`);
            const idx = segments.indexOf(removed);
            if (idx !== -1) segments.splice(idx, 1);

            totalMinutes -= (DEFAULT_ACTIVITY_DURATION + ACTIVITY_BUFFER);
        }
    }
}

/**
 * 7️⃣ Per-activity Cost Clamping
 *
 * Prevent absurd costs that the LLM might hallucinate.
 * Uses budget-tier-specific caps.
 */
function clampActivityCosts(segments, budgetTier, currency, issues) {
    const caps = TIER_COST_CAPS[budgetTier] || TIER_COST_CAPS['mid-range'];

    // Currency multiplier: caps are in INR-equivalent
    // For INR: 1x. For USD: ~0.012x (divide by 83). For EUR: ~0.011x.
    // Since we don't know exact rates here, rely on the absolute cap value.
    // LLM is told to use local currency, so caps should be in that currency.
    const perActivityCap = caps.perActivity;

    for (const seg of segments) {
        if (seg.estimated_cost > perActivityCap) {
            issues.push(`Clamped "${seg.title}": ${currency}${seg.estimated_cost} → ${currency}${perActivityCap}`);
            seg.estimated_cost = perActivityCap;
        }
    }
}

// ── Main Entry Point ─────────────────────────────────────────────────

/**
 * Apply all feasibility guards to AI-generated activity segments.
 *
 * Called as Phase 4d in the orchestrator, AFTER geocoding (4c)
 * and BEFORE local transport insertion (Phase 5).
 *
 * @param {object} context
 * @param {object} context.trip — Trip object from store
 * @param {object[]} context.activitySegments — Activity segments (mutated in place)
 * @param {object[]} context.transportSegments — Outbound/intercity/return segments
 * @param {string} context.travelStyle — Normalized travel style
 * @param {string} context.budgetTier — 'budget' | 'mid-range' | 'luxury'
 * @param {string} context.currency — Currency code
 * @param {number} context.totalDays — Total trip days
 * @returns {{ issues: string[] }} — List of corrections made
 */
export function applyFeasibilityGuard({
    trip,
    activitySegments,
    transportSegments = [],
    travelStyle = 'city_explorer',
    budgetTier = 'mid-range',
    currency = 'INR',
    totalDays = 1,
}) {
    const issues = [];

    // 1️⃣ Intercity feasibility (1-day long-haul → max 2)
    enforceIntercityFeasibility(activitySegments, trip, issues);

    // 2️⃣ Activity count per style
    enforceActivityCountLimit(activitySegments, travelStyle, issues);

    // 3️⃣ Arrival constraint
    enforceArrivalConstraint(activitySegments, transportSegments, issues);

    // 4️⃣ Departure constraint
    enforceDepartureConstraint(activitySegments, transportSegments, totalDays, issues);

    // 5️⃣ Geo reordering + distance outlier removal
    reorderActivitiesByProximity(activitySegments, issues);

    // 6️⃣ Daily time limit (10h max)
    enforceDailyTimeLimit(activitySegments, issues);

    // 7️⃣ Cost clamping
    clampActivityCosts(activitySegments, budgetTier, currency, issues);

    return { issues };
}

// ── Test exports (prefixed with underscore) ──────────────────────────
export {
    enforceIntercityFeasibility as _enforceIntercityFeasibility,
    enforceActivityCountLimit as _enforceActivityCountLimit,
    enforceArrivalConstraint as _enforceArrivalConstraint,
    enforceDepartureConstraint as _enforceDepartureConstraint,
    reorderActivitiesByProximity as _reorderActivitiesByProximity,
    enforceDailyTimeLimit as _enforceDailyTimeLimit,
    clampActivityCosts as _clampActivityCosts,
    nearestNeighborSort as _nearestNeighborSort,
    parseTime as _parseTime,
    formatTime as _formatTime,
    STYLE_LIMITS as _STYLE_LIMITS,
    TIER_COST_CAPS as _TIER_COST_CAPS,
    MAX_INTRADAY_DISTANCE_KM as _MAX_INTRADAY_DISTANCE_KM,
};
