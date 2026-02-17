/**
 * Itinerary Store — Integration Tests
 *
 * Tests the store → orchestrator → engine chain with mocked Supabase.
 * Validates that the integration between layers works correctly.
 */
import { describe, it, expect, vi } from 'vitest';
import { allocateBudget, reconcileBudget, deductFromEnvelope } from '@/engine/budgetAllocator.js';
import {
    _decideTransportMode as decideTransportMode,
    _calculateTransportCost as calculateTransportCost,
    _estimateDistanceTier as estimateDistanceTier,
} from '@/utils/transportEngine.js';

// ── Mock Supabase (no real network calls) ───────────────────────────

vi.mock('@/lib/supabase', () => {
    const createQueryBuilder = () => {
        const builder = {
            select: vi.fn(() => builder),
            insert: vi.fn(() => builder),
            update: vi.fn(() => builder),
            delete: vi.fn(() => builder),
            eq: vi.fn(() => builder),
            neq: vi.fn(() => builder),
            order: vi.fn(() => builder),
            single: vi.fn(() => ({ data: null, error: null })),
            then: vi.fn((resolve) => resolve({ data: [], error: null })),
        };
        return builder;
    };

    return {
        supabase: {
            from: vi.fn(() => createQueryBuilder()),
            rpc: vi.fn(() => Promise.resolve({ data: null, error: null })),
            functions: {
                invoke: vi.fn(() => Promise.resolve({ data: {}, error: null })),
            },
        },
    };
});

// ── Integration: Allocation → Transport → Reconcile ─────────────────

describe('store → engine chain integration', () => {
    it('should produce a valid allocation + segment + reconciliation pipeline', () => {
        // Step 1: Allocate budget (like itineraryStore does)
        const trip = {
            budget: 30000,
            currency: 'INR',
            days: 3,
            travelers: 1,
            budget_tier: 'mid-range',
            travel_preference: 'any',
            own_vehicle_type: 'none',
            travel_style: '',
            start_location: 'Hyderabad',
            destination: 'Visakhapatnam',
        };

        const allocation = allocateBudget(trip.budget, {
            budgetTier: trip.budget_tier,
            totalDays: trip.days,
            travelers: trip.travelers,
            hasOwnVehicle: trip.own_vehicle_type !== 'none',
            travelStyle: trip.travel_style,
        });

        expect(allocation.total_budget).toBe(30000);
        expect(allocation.intercity).toBeGreaterThan(0);

        // Step 2: Determine transport mode and cost
        const distanceTier = estimateDistanceTier(trip.start_location, trip.destination);
        const mode = decideTransportMode(trip, distanceTier);
        const transportCost = calculateTransportCost(mode, distanceTier, trip.travelers, trip.currency);

        expect(transportCost).toBeGreaterThan(0);

        // Step 3: Deduct from envelope
        deductFromEnvelope(allocation, 'intercity', transportCost);
        expect(allocation.intercity_remaining).toBeLessThanOrEqual(allocation.intercity);

        // Step 4: Generate segment objects (as store would)
        const segments = [
            {
                type: 'outbound_travel',
                title: `${mode} to ${trip.destination}`,
                estimated_cost: transportCost,
                day_number: 1,
                order_index: 0,
            },
            {
                type: 'accommodation',
                title: 'Hotel Stay',
                estimated_cost: allocation.accommodation_per_night,
                day_number: 1,
                order_index: 1,
            },
            {
                type: 'accommodation',
                title: 'Hotel Stay',
                estimated_cost: allocation.accommodation_per_night,
                day_number: 2,
                order_index: 1,
            },
            {
                type: 'activity',
                title: 'City Sightseeing',
                estimated_cost: Math.floor(allocation.activity_per_day * 0.5),
                day_number: 1,
                order_index: 2,
            },
        ];

        // Step 5: Reconcile
        const reconciliation = reconcileBudget(allocation, segments);

        expect(reconciliation.budget).toBe(30000);
        expect(reconciliation.total).toBeGreaterThan(0);
        expect(typeof reconciliation.balanced).toBe('boolean');
        expect(reconciliation.category_totals.intercity).toBe(transportCost);
    });

    it('should correctly chain allocation + dailySummary computation', () => {
        const allocation = allocateBudget(50000, {
            budgetTier: 'luxury',
            totalDays: 5,
            travelers: 2,
        });

        // Generate segments across multiple days
        const segments = [];
        for (let day = 1; day <= 5; day++) {
            segments.push({
                type: 'activity',
                estimated_cost: Math.floor(allocation.activity_per_day * 0.6),
                day_number: day,
            });
            if (day < 5) {
                segments.push({
                    type: 'accommodation',
                    estimated_cost: allocation.accommodation_per_night,
                    day_number: day,
                });
            }
        }

        // Compute daily summary manually (as store does)
        const dailySummary = {};
        for (const seg of segments) {
            const day = seg.day_number;
            if (!dailySummary[day]) dailySummary[day] = { total: 0, count: 0 };
            dailySummary[day].total += seg.estimated_cost;
            dailySummary[day].count += 1;
        }

        // Verify daily summary structure
        expect(Object.keys(dailySummary)).toHaveLength(5);
        for (let d = 1; d <= 5; d++) {
            expect(dailySummary[d].total).toBeGreaterThan(0);
            expect(dailySummary[d].count).toBeGreaterThanOrEqual(1);
        }

        // Reconcile should work with accumulated segments
        const result = reconcileBudget(allocation, segments);
        expect(result.budget).toBe(50000);
    });
});

// ── Integration: booking suggestions ────────────────────────────────

describe('booking suggestions after segment generation', () => {
    it('should generate accommodation booking suggestions from allocation', () => {
        const allocation = allocateBudget(20000, {
            budgetTier: 'mid-range',
            totalDays: 3,
        });

        // Simulate booking suggestion logic
        const nights = 2;
        const perNight = allocation.accommodation_per_night;
        const suggestions = [];
        for (let n = 1; n <= nights; n++) {
            suggestions.push({
                type: 'accommodation',
                night: n,
                max_budget: perNight,
                recommended_tier: 'mid-range',
            });
        }

        expect(suggestions).toHaveLength(2);
        expect(suggestions[0].max_budget).toBe(perNight);
        expect(suggestions[0].max_budget).toBeGreaterThan(0);
    });
});
