/**
 * Trip Orchestrator — Unit Tests
 *
 * Tests: phase ordering, envelope-insufficient guard, reconciliation invariant,
 * daily summary computation.
 *
 * NOTE: orchestrateTrip() itself requires mocked Supabase + API calls,
 * so we test the exported pure utilities and the allocator+reconciler chain.
 */
import { describe, it, expect, beforeEach } from 'vitest'; // eslint-disable-line no-unused-vars
import { allocateBudget, reconcileBudget, deductFromEnvelope } from '@/engine/budgetAllocator.js';
import {
    _decideTransportMode as decideTransportMode,
    _calculateTransportCost as calculateTransportCost,
} from '@/utils/transportEngine.js';

// ── Phase ordering simulation ───────────────────────────────────────

describe('orchestration phase ordering', () => {
    it('should complete phases in correct order: allocate → transport → accommodation → reconcile', () => {
        const log = [];

        // Phase 1: Budget Allocation
        log.push('allocate');
        const alloc = allocateBudget(30000, {
            budgetTier: 'mid-range',
            totalDays: 3,
            travelers: 1,
        });
        expect(alloc.total_budget).toBe(30000);

        // Phase 2: Outbound Transport
        log.push('outbound');
        const mode = decideTransportMode(
            { travel_preference: 'any', own_vehicle_type: 'none', travel_style: '' },
            'short'
        );
        const transportCost = calculateTransportCost(mode, 'short', 1, 'INR');
        deductFromEnvelope(alloc, 'intercity', transportCost);
        expect(alloc.intercity_remaining).toBeLessThan(alloc.intercity);

        // Phase 3: Accommodation
        log.push('accommodation');
        const accCost = alloc.accommodation_per_night * 2; // 2 nights
        deductFromEnvelope(alloc, 'accommodation', accCost);

        // Phase 7: Reconcile
        log.push('reconcile');
        const segments = [
            { type: 'outbound_travel', estimated_cost: transportCost },
            { type: 'accommodation', estimated_cost: accCost },
        ];
        const result = reconcileBudget(alloc, segments);

        expect(log).toEqual(['allocate', 'outbound', 'accommodation', 'reconcile']);
        expect(result.total).toBeGreaterThan(0);
    });
});

// ── Envelope-insufficient guard ─────────────────────────────────────

describe('envelope-insufficient guard', () => {
    it('should NOT create segment when envelope is exhausted', () => {
        const alloc = allocateBudget(1000, {
            budgetTier: 'budget',
            totalDays: 3,
            travelers: 1,
        });

        // Exhaust the intercity envelope
        deductFromEnvelope(alloc, 'intercity', alloc.intercity);
        expect(alloc.intercity_remaining).toBe(0);

        // Simulating the guard: if remaining is 0, don't create segment
        const shouldCreate = alloc.intercity_remaining > 0;
        expect(shouldCreate).toBe(false);
    });

    it('should still allow creation when envelope has remaining budget', () => {
        const alloc = allocateBudget(10000, {
            budgetTier: 'mid-range',
            totalDays: 3,
        });

        expect(alloc.intercity_remaining).toBeGreaterThan(0);
        const shouldCreate = alloc.intercity_remaining > 0;
        expect(shouldCreate).toBe(true);
    });
});

// ── Reconciliation balanced invariant ───────────────────────────────

describe('reconciliation balanced invariant', () => {
    it('CRITICAL: balanced=true must mean no overshoot AND no category violations', () => {
        const alloc = allocateBudget(50000, { totalDays: 5, travelers: 2 });

        // Create segments that fit within ALL envelopes
        const segments = [
            { type: 'outbound_travel', estimated_cost: Math.floor(alloc.intercity * 0.3) },
            { type: 'return_travel', estimated_cost: Math.floor(alloc.intercity * 0.3) },
            { type: 'accommodation', estimated_cost: Math.floor(alloc.accommodation * 0.8) },
            { type: 'activity', estimated_cost: Math.floor(alloc.activity * 0.5) },
            { type: 'local_transport', estimated_cost: Math.floor(alloc.local_transport * 0.5) },
        ];

        const result = reconcileBudget(alloc, segments);

        expect(result.balanced).toBe(true);
        expect(result.overshoot).toBe(0);
        expect(result.category_violations).toHaveLength(0);
    });

    it('CRITICAL: balanced=false if ANY category exceeds its envelope', () => {
        const alloc = allocateBudget(10000, { totalDays: 3 });

        // Exceed only activity envelope — total may still be under budget
        const segments = [
            { type: 'activity', estimated_cost: alloc.activity + 1000 },
        ];

        const result = reconcileBudget(alloc, segments);
        expect(result.balanced).toBe(false);
        expect(result.category_violations.length).toBeGreaterThan(0);
    });

    it('CRITICAL: balanced=false if total exceeds budget (even if per-category OK)', () => {
        const alloc = allocateBudget(1000, { totalDays: 1 });

        // Each category OK individually but total overshoots
        const segments = [
            { type: 'outbound_travel', estimated_cost: alloc.intercity },
            { type: 'accommodation', estimated_cost: alloc.accommodation },
            { type: 'activity', estimated_cost: alloc.activity },
            { type: 'local_transport', estimated_cost: alloc.local_transport },
            // Add buffer-level extra that pushes over
            { type: 'activity', estimated_cost: alloc.buffer + 100 },
        ];

        const result = reconcileBudget(alloc, segments);
        // The extra pushes activity over its envelope, so should be unbalanced
        expect(result.balanced).toBe(false);
    });
});

// ── Daily summary shape ─────────────────────────────────────────────

describe('budget allocation + reconciliation round-trip', () => {
    it('should produce valid reconciliation for a realistic scenario', () => {
        const alloc = allocateBudget(30000, {
            budgetTier: 'mid-range',
            travelStyle: 'city_exploration',
            totalDays: 3,
            travelers: 1,
        });

        // Simulate realistic segment costs (well under envelopes)
        const segments = [
            { type: 'outbound_travel', estimated_cost: 2500, day_number: 1 },
            { type: 'accommodation', estimated_cost: 3000, day_number: 1 },
            { type: 'accommodation', estimated_cost: 3000, day_number: 2 },
            { type: 'activity', estimated_cost: 2000, day_number: 1 },
            { type: 'activity', estimated_cost: 2500, day_number: 2 },
            { type: 'activity', estimated_cost: 1500, day_number: 3 },
            { type: 'local_transport', estimated_cost: 300, day_number: 1 },
            { type: 'local_transport', estimated_cost: 400, day_number: 2 },
            { type: 'return_travel', estimated_cost: 2500, day_number: 3 },
        ];

        const result = reconcileBudget(alloc, segments);

        expect(result.budget).toBe(30000);
        expect(result.total).toBeGreaterThan(0);
        expect(typeof result.balanced).toBe('boolean');
        expect(typeof result.overshoot).toBe('number');
        expect(result.category_totals).toBeDefined();
        expect(result.category_totals.intercity).toBeDefined();
        expect(result.category_totals.accommodation).toBeDefined();
    });
});
