/**
 * Feasibility Guard — Unit Tests
 *
 * Tests all 7 guard functions for correctness.
 */
import { describe, it, expect } from 'vitest';
import {
    applyFeasibilityGuard,
    _enforceActivityCountLimit as enforceActivityCountLimit,
    _enforceDailyTimeLimit as enforceDailyTimeLimit,
    _clampActivityCosts as clampActivityCosts,
    _nearestNeighborSort as nearestNeighborSort,
    _parseTime as parseTime,
    _formatTime as formatTime,
    _STYLE_LIMITS as STYLE_LIMITS,
} from '@/engine/feasibilityGuard.js';

// ── Helpers ──────────────────────────────────────────────────────────

const makeActivity = (overrides = {}) => ({
    trip_id: 'test-trip',
    type: 'activity',
    title: overrides.title || 'Test Activity',
    day_number: overrides.day_number || 1,
    location: overrides.location || 'Test City',
    estimated_cost: overrides.estimated_cost || 100,
    order_index: overrides.order_index || 0,
    latitude: overrides.latitude || null,
    longitude: overrides.longitude || null,
    metadata: {
        time: overrides.time || '09:00',
        activityType: 'sightseeing',
        notes: '',
        ...(overrides.metadata || {}),
    },
});

const makeTrip = (overrides = {}) => ({
    id: 'test-trip',
    destination: overrides.destination || 'Tirupati',
    start_location: overrides.start_location || 'Visakhapatnam',
    return_location: overrides.return_location || 'Visakhapatnam',
    totalDays: overrides.totalDays || 1,
    travelers: 1,
    budget: 5000,
    currency: 'INR',
    ...overrides,
});

// ── Time Utilities ───────────────────────────────────────────────────

describe('Time Utilities', () => {
    it('parseTime: should parse HH:MM to minutes', () => {
        expect(parseTime('08:00')).toBe(480);
        expect(parseTime('09:30')).toBe(570);
        expect(parseTime('21:00')).toBe(1260);
    });

    it('parseTime: should default to 08:00 for invalid input', () => {
        expect(parseTime(null)).toBe(480);
        expect(parseTime(undefined)).toBe(480);
        expect(parseTime('')).toBe(480);
    });

    it('formatTime: should format minutes to HH:MM', () => {
        expect(formatTime(480)).toBe('08:00');
        expect(formatTime(570)).toBe('09:30');
        expect(formatTime(1260)).toBe('21:00');
    });
});

// ── Style Limits ─────────────────────────────────────────────────────

describe('STYLE_LIMITS', () => {
    it('should have correct limits per style', () => {
        expect(STYLE_LIMITS.relaxation).toBe(3);
        expect(STYLE_LIMITS.city_explorer).toBe(4);
        expect(STYLE_LIMITS.adventure).toBe(5);
        expect(STYLE_LIMITS.business).toBe(2);
        expect(STYLE_LIMITS.road_trip).toBe(4);
    });
});

// ── Activity Count Limit ─────────────────────────────────────────────

describe('enforceActivityCountLimit', () => {
    it('should trim activities exceeding relaxation limit (3)', () => {
        const segments = [
            makeActivity({ title: 'A1', order_index: 0 }),
            makeActivity({ title: 'A2', order_index: 1 }),
            makeActivity({ title: 'A3', order_index: 2 }),
            makeActivity({ title: 'A4', order_index: 3 }),
            makeActivity({ title: 'A5', order_index: 4 }),
        ];
        const issues = [];
        enforceActivityCountLimit(segments, 'relaxation', issues);

        expect(segments.length).toBe(3);
        expect(issues.length).toBe(1);
        expect(issues[0]).toContain('relaxation');
    });

    it('should NOT trim if under limit', () => {
        const segments = [
            makeActivity({ title: 'A1', order_index: 0 }),
            makeActivity({ title: 'A2', order_index: 1 }),
        ];
        const issues = [];
        enforceActivityCountLimit(segments, 'adventure', issues);

        expect(segments.length).toBe(2);
        expect(issues.length).toBe(0);
    });

    it('should handle business style (max 2)', () => {
        const segments = [
            makeActivity({ title: 'Meeting', order_index: 0 }),
            makeActivity({ title: 'Lunch', order_index: 1 }),
            makeActivity({ title: 'Tour', order_index: 2 }),
        ];
        const issues = [];
        enforceActivityCountLimit(segments, 'business', issues);

        expect(segments.length).toBe(2);
    });
});

// ── Daily Time Limit ─────────────────────────────────────────────────

describe('enforceDailyTimeLimit', () => {
    it('should allow up to 10 hours of activities', () => {
        // 6 activities × 60min + 5 buffers × 30min = 510min < 600min
        const segments = Array.from({ length: 6 }, (_, i) =>
            makeActivity({ title: `A${i + 1}`, order_index: i })
        );
        const issues = [];
        enforceDailyTimeLimit(segments, issues);

        expect(segments.length).toBe(6);
        expect(issues.length).toBe(0);
    });

    it('should trim when exceeding 10 hours', () => {
        // 8 activities × 60min + 7 buffers × 30min = 690min > 600min
        const segments = Array.from({ length: 8 }, (_, i) =>
            makeActivity({ title: `A${i + 1}`, order_index: i })
        );
        const issues = [];
        enforceDailyTimeLimit(segments, issues);

        expect(segments.length).toBeLessThanOrEqual(7);
        expect(issues.length).toBeGreaterThanOrEqual(1);
    });
});

// ── Cost Clamping ────────────────────────────────────────────────────

describe('clampActivityCosts', () => {
    it('should clamp budget tier activities over ₹500', () => {
        const segments = [
            makeActivity({ title: 'Expensive', estimated_cost: 2000 }),
            makeActivity({ title: 'Normal', estimated_cost: 200 }),
        ];
        const issues = [];
        clampActivityCosts(segments, 'budget', 'INR', issues);

        expect(segments[0].estimated_cost).toBe(500);
        expect(segments[1].estimated_cost).toBe(200);
        expect(issues.length).toBe(1);
    });

    it('should NOT clamp if under cap', () => {
        const segments = [
            makeActivity({ title: 'Normal', estimated_cost: 300 }),
        ];
        const issues = [];
        clampActivityCosts(segments, 'mid-range', 'INR', issues);

        expect(segments[0].estimated_cost).toBe(300);
        expect(issues.length).toBe(0);
    });
});

// ── Nearest Neighbor Sort ────────────────────────────────────────────

describe('nearestNeighborSort', () => {
    it('should sort activities by proximity (nearest neighbor)', () => {
        // 3 activities: A(0,0), B(0,100), C(0,1)
        // Optimal: A → C → B (not A → B → C)
        const activities = [
            makeActivity({ title: 'A', latitude: 0, longitude: 0, time: '09:00' }),
            makeActivity({ title: 'B', latitude: 0, longitude: 1,   time: '10:00' }),
            makeActivity({ title: 'C', latitude: 0, longitude: 0.01, time: '11:00' }),
        ];

        const sorted = nearestNeighborSort(activities);

        expect(sorted[0].title).toBe('A');
        expect(sorted[1].title).toBe('C');  // closest to A
        expect(sorted[2].title).toBe('B');  // closest to C
    });

    it('should handle single activity', () => {
        const activities = [makeActivity({ title: 'Solo', latitude: 0, longitude: 0 })];
        const sorted = nearestNeighborSort(activities);
        expect(sorted.length).toBe(1);
    });
});

// ── Full Integration ─────────────────────────────────────────────────

describe('applyFeasibilityGuard (full)', () => {
    it('should enforce intercity feasibility for 1-day long-haul', () => {
        const trip = makeTrip({ totalDays: 1 });
        const segments = Array.from({ length: 5 }, (_, i) =>
            makeActivity({ title: `Act${i + 1}`, order_index: i })
        );

        const result = applyFeasibilityGuard({
            trip,
            activitySegments: segments,
            travelStyle: 'city_explorer',
            budgetTier: 'mid-range',
            currency: 'INR',
            totalDays: 1,
        });

        // Should be reduced: intercity (max 2) then style limit doesn't apply (2 < 4)
        expect(segments.length).toBe(2);
        expect(result.issues.length).toBeGreaterThanOrEqual(1);
    });

    it('should NOT apply intercity limit for multi-day trips', () => {
        const trip = makeTrip({ totalDays: 3 });
        const segments = Array.from({ length: 4 }, (_, i) =>
            makeActivity({ title: `Act${i + 1}`, order_index: i })
        );

        const result = applyFeasibilityGuard({
            trip,
            activitySegments: segments,
            travelStyle: 'city_explorer',
            budgetTier: 'mid-range',
            currency: 'INR',
            totalDays: 3,
        });

        expect(segments.length).toBe(4); // 4 ≤ city_explorer limit of 4
    });

    it('should return empty issues when no violations', () => {
        const trip = makeTrip({ totalDays: 2, start_location: 'Tirupati' });
        const segments = [
            makeActivity({ title: 'Temple', order_index: 0, estimated_cost: 300 }),
            makeActivity({ title: 'Lunch', order_index: 1, estimated_cost: 150 }),
        ];

        const result = applyFeasibilityGuard({
            trip,
            activitySegments: segments,
            travelStyle: 'relaxation',
            budgetTier: 'mid-range',
            currency: 'INR',
            totalDays: 2,
        });

        expect(result.issues.length).toBe(0);
        expect(segments.length).toBe(2);
    });
});
