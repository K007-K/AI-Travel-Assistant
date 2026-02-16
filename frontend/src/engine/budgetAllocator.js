/**
 * Budget Allocator — Phase 1 of Trip Orchestration
 *
 * Splits total_budget into categorical envelopes BEFORE any generation.
 * No AI calls — pure algorithmic allocation.
 * Also contains checkStrictBudget() for Rule 5 enforcement.
 *
 * @module engine/budgetAllocator
 */

import { supabase } from '../lib/supabase';

// ── Rule 5: Strict Budget Guard ──────────────────────────────────────

/**
 * Check if adding a segment would exceed strict budget.
 * Returns { allowed: true } or { allowed: false, message: string }.
 */
export async function checkStrictBudget(tripId, newCost) {
    const { data: trip } = await supabase
        .from('trips')
        .select('budget, budget_type')
        .eq('id', tripId)
        .single();

    if (!trip || trip.budget_type !== 'strict' || !trip.budget) {
        return { allowed: true };
    }

    const { data: segments } = await supabase
        .from('trip_segments')
        .select('estimated_cost, type')
        .eq('trip_id', tripId)
        .neq('type', 'gem');

    const cumulativeCost = (segments || []).reduce(
        (sum, s) => sum + (parseFloat(s.estimated_cost) || 0), 0
    );

    const totalAfter = cumulativeCost + (parseFloat(newCost) || 0);

    if (totalAfter > parseFloat(trip.budget)) {
        return {
            allowed: false,
            message: `Budget exceeded in strict mode. Current: ${Math.round(cumulativeCost)}, Adding: ${Math.round(newCost)}, Limit: ${trip.budget}`,
        };
    }

    return { allowed: true };
}

// ── Default allocation ratios ────────────────────────────────────────

const DEFAULT_RATIOS = {
    intercity: 0.20,
    accommodation: 0.30,
    local_transport: 0.05,
    activity: 0.37,
    buffer: 0.08,
};

const ROAD_TRIP_RATIOS = {
    intercity: 0.10,       // Less — own vehicle, mostly fuel
    accommodation: 0.20,   // Flexible lodging is cheaper
    local_transport: 0.03, // Minimal — driving between activities
    activity: 0.55,        // More budget for experiences
    buffer: 0.12,          // Higher buffer for fuel price variance
};

const LUXURY_RATIOS = {
    intercity: 0.22,
    accommodation: 0.35,   // Premium stays
    local_transport: 0.03, // Private transport
    activity: 0.30,
    buffer: 0.05,
    upgrade_pool: 0.05,    // Extra pool for premium upgrades
};

// ── Main Allocator ───────────────────────────────────────────────────

/**
 * Allocate total budget into categorical envelopes.
 *
 * @param {number} totalBudget       — Total trip budget in currency units
 * @param {object} options
 * @param {string} options.travelStyle    — 'road_trip' | 'adventure' | 'relaxation' | etc.
 * @param {string} options.budgetTier     — 'budget' | 'mid-range' | 'luxury'
 * @param {number} options.totalDays      — Number of days
 * @param {number} options.totalNights    — Number of overnight stays (usually totalDays - 1)
 * @param {number} options.travelers      — Number of travelers
 * @param {boolean} options.hasOwnVehicle — Whether the user has their own vehicle
 * @returns {BudgetAllocation}
 */
export function allocateBudget(totalBudget, options = {}) {
    const {
        travelStyle = '',
        budgetTier = 'mid-range',
        totalDays = 1,
        totalNights = Math.max(0, totalDays - 1),
        travelers = 1,
        hasOwnVehicle = false,
    } = options;

    // Select ratio set
    let ratios;
    if (travelStyle === 'road_trip') {
        ratios = { ...ROAD_TRIP_RATIOS };
    } else if (budgetTier === 'luxury') {
        ratios = { ...LUXURY_RATIOS };
    } else {
        ratios = { ...DEFAULT_RATIOS };
    }

    // Adjustment: own vehicle reduces intercity, adds to activity
    if (hasOwnVehicle && travelStyle !== 'road_trip') {
        const saved = ratios.intercity * 0.5;
        ratios.intercity -= saved;
        ratios.activity += saved;
    }

    // Normalize ratios to sum to 1.0
    const ratioSum = Object.values(ratios).reduce((s, v) => s + v, 0);
    Object.keys(ratios).forEach(k => {
        ratios[k] = ratios[k] / ratioSum;
    });

    // Compute absolute values
    const allocation = {
        total_budget: totalBudget,
        intercity: Math.round(totalBudget * ratios.intercity),
        accommodation: Math.round(totalBudget * ratios.accommodation),
        local_transport: Math.round(totalBudget * ratios.local_transport),
        activity: Math.round(totalBudget * ratios.activity),
        buffer: Math.round(totalBudget * ratios.buffer),
    };

    // Luxury gets upgrade pool
    if (ratios.upgrade_pool) {
        allocation.upgrade_pool = Math.round(totalBudget * ratios.upgrade_pool);
    }

    // Derived values
    allocation.activity_per_day = totalDays > 0
        ? Math.round(allocation.activity / totalDays)
        : allocation.activity;

    allocation.accommodation_per_night = totalNights > 0
        ? Math.round(allocation.accommodation / totalNights)
        : 0;

    allocation.intercity_remaining = allocation.intercity;
    allocation.accommodation_remaining = allocation.accommodation;
    allocation.local_transport_remaining = allocation.local_transport;
    allocation.activity_remaining = allocation.activity;

    // Metadata
    allocation._meta = {
        ratios,
        travelStyle,
        budgetTier,
        totalDays,
        totalNights,
        travelers,
        hasOwnVehicle,
    };

    // Validate: all sub-budgets must sum to ≤ total_budget
    const allocated = allocation.intercity + allocation.accommodation
        + allocation.local_transport + allocation.activity
        + allocation.buffer + (allocation.upgrade_pool || 0);

    if (allocated > totalBudget) {
        // Trim buffer to fit
        allocation.buffer -= (allocated - totalBudget);
    }

    return allocation;
}

/**
 * Deduct a cost from a specific envelope.
 * Returns the updated allocation (mutates in place for performance).
 *
 * @param {BudgetAllocation} allocation
 * @param {'intercity'|'accommodation'|'local_transport'|'activity'|'buffer'} category
 * @param {number} cost
 * @returns {BudgetAllocation}
 */
export function deductFromEnvelope(allocation, category, cost) {
    const remainingKey = `${category}_remaining`;
    if (allocation[remainingKey] !== undefined) {
        allocation[remainingKey] = Math.max(0, allocation[remainingKey] - cost);
    }
    return allocation;
}

/**
 * Reconcile: assert per-category + aggregate budget compliance.
 *
 * @param {BudgetAllocation} allocation
 * @param {object[]} segments — All generated segments
 * @returns {{ balanced: boolean, total: number, overshoot: number, category_violations: object[] }}
 */
export function reconcileBudget(allocation, segments) {
    // Category → segment type mapping
    const categoryMap = {
        intercity: ['outbound_travel', 'return_travel', 'intercity_travel'],
        accommodation: ['accommodation'],
        local_transport: ['local_transport'],
        activity: ['activity'],
    };

    const categoryTotals = {};
    const categoryViolations = [];

    for (const [category, types] of Object.entries(categoryMap)) {
        const catTotal = segments
            .filter(s => types.includes(s.type))
            .reduce((sum, s) => sum + (parseFloat(s.estimated_cost) || 0), 0);
        categoryTotals[category] = Math.round(catTotal);

        const envelope = allocation[category] || 0;
        if (catTotal > envelope) {
            categoryViolations.push({
                category,
                envelope,
                actual: Math.round(catTotal),
                overshoot: Math.round(catTotal - envelope),
            });
        }
    }

    const total = segments.reduce((s, seg) => s + (parseFloat(seg.estimated_cost) || 0), 0);
    const overshoot = Math.max(0, total - allocation.total_budget);

    return {
        balanced: overshoot === 0 && categoryViolations.length === 0,
        total: Math.round(total),
        budget: allocation.total_budget,
        overshoot: Math.round(overshoot),
        buffer_remaining: Math.max(0, allocation.buffer - overshoot),
        category_totals: categoryTotals,
        category_violations: categoryViolations,
    };
}
