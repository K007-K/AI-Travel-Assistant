/**
 * Budget Allocator — Unit Tests
 *
 * Tests: ratio selection, own-vehicle adjustment, normalization,
 * zero/edge budgets, per-day/per-night calculations, reconciliation.
 */
import { describe, it, expect } from 'vitest';
import {
    allocateBudget,
    deductFromEnvelope,
    reconcileBudget,
} from '@/engine/budgetAllocator.js';

// ── allocateBudget ──────────────────────────────────────────────────

describe('allocateBudget', () => {
    describe('ratio selection', () => {
        it('should use default ratios for mid-range tier', () => {
            const alloc = allocateBudget(10000, { budgetTier: 'mid-range', totalDays: 3 });
            // Default: intercity 20%, accommodation 30%, local 5%, activity 37%, buffer 8%
            expect(alloc.intercity).toBe(2000);
            expect(alloc.accommodation).toBe(3000);
            expect(alloc.activity).toBe(3700);
        });

        it('should use road trip ratios when travel_style is road_trip', () => {
            const alloc = allocateBudget(10000, { travelStyle: 'road_trip', totalDays: 3 });
            // Road trip: intercity 10%, activity 55%
            expect(alloc.intercity).toBe(1000);
            expect(alloc.activity).toBe(5500);
        });

        it('should use luxury ratios when budgetTier is luxury', () => {
            const alloc = allocateBudget(10000, { budgetTier: 'luxury', totalDays: 3 });
            // Luxury: accommodation 35%, has upgrade_pool
            expect(alloc.accommodation).toBe(3500);
            expect(alloc.upgrade_pool).toBeDefined();
            expect(alloc.upgrade_pool).toBeGreaterThan(0);
        });
    });

    describe('own vehicle adjustment', () => {
        it('should reduce intercity and increase activity when hasOwnVehicle', () => {
            const noVehicle = allocateBudget(10000, { hasOwnVehicle: false, totalDays: 3 });
            const withVehicle = allocateBudget(10000, { hasOwnVehicle: true, totalDays: 3 });
            expect(withVehicle.intercity).toBeLessThan(noVehicle.intercity);
            expect(withVehicle.activity).toBeGreaterThan(noVehicle.activity);
        });

        it('should NOT adjust for road_trip style even with own vehicle', () => {
            const roadTrip = allocateBudget(10000, {
                travelStyle: 'road_trip',
                hasOwnVehicle: true,
                totalDays: 3,
            });
            // Road trip ratios should apply unchanged
            expect(roadTrip.intercity).toBe(1000);
        });
    });

    describe('normalization', () => {
        it('should ensure sub-budgets sum to ≤ total_budget', () => {
            const alloc = allocateBudget(10000, { totalDays: 3 });
            const sum = alloc.intercity + alloc.accommodation
                + alloc.local_transport + alloc.activity
                + alloc.buffer + (alloc.upgrade_pool || 0);
            expect(sum).toBeLessThanOrEqual(10000);
        });

        it('should normalize even with luxury upgrade pool', () => {
            const alloc = allocateBudget(10000, { budgetTier: 'luxury', totalDays: 3 });
            const sum = alloc.intercity + alloc.accommodation
                + alloc.local_transport + alloc.activity
                + alloc.buffer + (alloc.upgrade_pool || 0);
            expect(sum).toBeLessThanOrEqual(10000);
        });
    });

    describe('zero and edge budgets', () => {
        it('should handle zero budget gracefully', () => {
            const alloc = allocateBudget(0, { totalDays: 3 });
            expect(alloc.total_budget).toBe(0);
            expect(alloc.intercity).toBe(0);
            expect(alloc.accommodation).toBe(0);
        });

        it('should handle very small budget (1 unit)', () => {
            const alloc = allocateBudget(1, { totalDays: 1 });
            expect(alloc.total_budget).toBe(1);
        });

        it('should handle very large budget', () => {
            const alloc = allocateBudget(1_000_000, { totalDays: 10 });
            expect(alloc.total_budget).toBe(1_000_000);
            expect(alloc.activity_per_day).toBeGreaterThan(0);
        });
    });

    describe('per-day and per-night calculations', () => {
        it('should compute activity_per_day correctly', () => {
            const alloc = allocateBudget(10000, { totalDays: 5 });
            expect(alloc.activity_per_day).toBe(Math.round(alloc.activity / 5));
        });

        it('should compute accommodation_per_night for N-1 nights', () => {
            const alloc = allocateBudget(10000, { totalDays: 4 });
            // totalNights defaults to totalDays - 1 = 3
            expect(alloc.accommodation_per_night).toBe(Math.round(alloc.accommodation / 3));
        });

        it('should set accommodation_per_night to 0 for single day trip', () => {
            const alloc = allocateBudget(10000, { totalDays: 1 });
            // 0 nights → per_night = 0
            expect(alloc.accommodation_per_night).toBe(0);
        });
    });

    describe('remaining values initialized', () => {
        it('should set remaining values equal to envelope values', () => {
            const alloc = allocateBudget(10000, { totalDays: 3 });
            expect(alloc.intercity_remaining).toBe(alloc.intercity);
            expect(alloc.accommodation_remaining).toBe(alloc.accommodation);
            expect(alloc.local_transport_remaining).toBe(alloc.local_transport);
            expect(alloc.activity_remaining).toBe(alloc.activity);
        });
    });

    describe('metadata', () => {
        it('should include _meta with options', () => {
            const alloc = allocateBudget(10000, {
                travelStyle: 'adventure',
                budgetTier: 'mid-range',
                totalDays: 5,
                travelers: 2,
            });
            expect(alloc._meta).toBeDefined();
            expect(alloc._meta.travelStyle).toBe('adventure');
            expect(alloc._meta.travelers).toBe(2);
        });
    });
});

// ── deductFromEnvelope ──────────────────────────────────────────────

describe('deductFromEnvelope', () => {
    it('should deduct cost from remaining', () => {
        const alloc = allocateBudget(10000, { totalDays: 3 });
        const before = alloc.intercity_remaining;
        deductFromEnvelope(alloc, 'intercity', 500);
        expect(alloc.intercity_remaining).toBe(before - 500);
    });

    it('should clamp remaining at 0 (no negative)', () => {
        const alloc = allocateBudget(1000, { totalDays: 1 });
        deductFromEnvelope(alloc, 'intercity', 999999);
        expect(alloc.intercity_remaining).toBe(0);
    });

    it('should not affect other categories', () => {
        const alloc = allocateBudget(10000, { totalDays: 3 });
        const actBefore = alloc.activity_remaining;
        deductFromEnvelope(alloc, 'intercity', 500);
        expect(alloc.activity_remaining).toBe(actBefore);
    });
});

// ── reconcileBudget ─────────────────────────────────────────────────

describe('reconcileBudget', () => {
    it('should return balanced=true when segments fit within envelopes', () => {
        const alloc = allocateBudget(10000, { totalDays: 3 });
        const segments = [
            { type: 'outbound_travel', estimated_cost: 500 },
            { type: 'accommodation', estimated_cost: 1000 },
            { type: 'activity', estimated_cost: 2000 },
            { type: 'local_transport', estimated_cost: 200 },
        ];
        const result = reconcileBudget(alloc, segments);
        expect(result.balanced).toBe(true);
        expect(result.overshoot).toBe(0);
    });

    it('should return balanced=false when total exceeds budget', () => {
        const alloc = allocateBudget(1000, { totalDays: 1 });
        const segments = [
            { type: 'activity', estimated_cost: 5000 },
        ];
        const result = reconcileBudget(alloc, segments);
        expect(result.balanced).toBe(false);
        expect(result.overshoot).toBeGreaterThan(0);
    });

    it('should detect per-category violations', () => {
        const alloc = allocateBudget(10000, { totalDays: 3 });
        // Exceed the intercity envelope (default 2000)
        const segments = [
            { type: 'outbound_travel', estimated_cost: 3000 },
        ];
        const result = reconcileBudget(alloc, segments);
        expect(result.category_violations.length).toBeGreaterThan(0);
        expect(result.category_violations[0].category).toBe('intercity');
    });

    it('should handle empty segments list', () => {
        const alloc = allocateBudget(10000, { totalDays: 3 });
        const result = reconcileBudget(alloc, []);
        expect(result.balanced).toBe(true);
        expect(result.total).toBe(0);
    });

    // CRITICAL: Reconciliation balanced invariant
    it('INVARIANT: balanced=true requires zero overshoot AND zero violations', () => {
        const alloc = allocateBudget(10000, { totalDays: 3 });
        const segments = [
            { type: 'outbound_travel', estimated_cost: alloc.intercity - 100 },
            { type: 'accommodation', estimated_cost: alloc.accommodation - 100 },
            { type: 'activity', estimated_cost: alloc.activity - 100 },
            { type: 'local_transport', estimated_cost: alloc.local_transport - 50 },
        ];
        const result = reconcileBudget(alloc, segments);
        // If balanced is true, both conditions must hold
        if (result.balanced) {
            expect(result.overshoot).toBe(0);
            expect(result.category_violations).toHaveLength(0);
        }
    });
});
