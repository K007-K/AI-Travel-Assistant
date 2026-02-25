/**
 * Trip Duration Planner — Unit Tests (Overnight + Tiered Formula)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/api/routeTime.js', () => ({
    getRouteTime: vi.fn(),
}));

import { planTripDuration, _canTravelOvernight, _computeTravelDays } from '@/engine/tripDurationPlanner.js';
import { getRouteTime } from '@/api/routeTime.js';

// ── Pure function tests ──────────────────────────────────────────────

describe('computeTravelDays', () => {
    it('≤3h → 0 travel days', () => {
        expect(_computeTravelDays(2.5, 'mid')).toBe(0);
        expect(_computeTravelDays(3, 'mid')).toBe(0);
    });

    it('6-16h budget → 0 (overnight)', () => {
        expect(_computeTravelDays(9.4, 'low')).toBe(0);
        expect(_computeTravelDays(12, 'mid')).toBe(0);
    });

    it('6-16h luxury → 1 (no overnight)', () => {
        expect(_computeTravelDays(9.4, 'high')).toBe(1);
    });

    it('4-5h (not overnight eligible) → 1 travel day', () => {
        expect(_computeTravelDays(5, 'mid')).toBe(1);
    });

    it('>16h → travel days (not overnight eligible)', () => {
        expect(_computeTravelDays(18, 'mid')).toBe(2);
    });

    it('>24h → ceil(h/12)', () => {
        expect(_computeTravelDays(30, 'mid')).toBe(3);
    });
});

describe('canTravelOvernight', () => {
    it('6-16h budget/mid → true', () => {
        expect(_canTravelOvernight(9.4, 'low')).toBe(true);
        expect(_canTravelOvernight(9.4, 'mid')).toBe(true);
    });

    it('6-16h high → false', () => {
        expect(_canTravelOvernight(9.4, 'high')).toBe(false);
    });

    it('<6h → false', () => {
        expect(_canTravelOvernight(5, 'low')).toBe(false);
    });

    it('>16h → false', () => {
        expect(_canTravelOvernight(18, 'low')).toBe(false);
    });
});

// ── Integration tests (mocked OSRM) ─────────────────────────────────

describe('planTripDuration — same-city', () => {
    it('should be feasible immediately', async () => {
        const result = await planTripDuration({
            startLocation: 'Tirupati',
            returnLocation: 'Tirupati',
            destinations: [{ location: 'Tirupati', days: 2 }],
            requestedDays: 2,
        });
        expect(result.feasible).toBe(true);
        expect(result.travelDaysRequired).toBe(0);
        expect(getRouteTime).not.toHaveBeenCalled();
    });
});

describe('planTripDuration — overnight travel', () => {
    beforeEach(() => vi.clearAllMocks());

    it('Vizag→Tirupati 9.4h budget → 0 travel days (overnight)', async () => {
        getRouteTime.mockResolvedValue({ hours: 9.4, distanceKm: 766, source: 'osrm' });

        const result = await planTripDuration({
            startLocation: 'Visakhapatnam',
            returnLocation: 'Visakhapatnam',
            destinations: [{ location: 'Tirupati', days: 1 }],
            requestedDays: 1,
            budgetTier: 'low',
        });

        expect(result.feasible).toBe(true);
        expect(result.travelDaysRequired).toBe(0);
        expect(result.allOvernight).toBe(true);
        expect(result.segments[0].canOvernight).toBe(true);
    });

    it('Vizag→Tirupati 9.4h luxury → 2 travel days (no overnight)', async () => {
        getRouteTime.mockResolvedValue({ hours: 9.4, distanceKm: 766, source: 'osrm' });

        const result = await planTripDuration({
            startLocation: 'Visakhapatnam',
            returnLocation: 'Visakhapatnam',
            destinations: [{ location: 'Tirupati', days: 1 }],
            requestedDays: 1,
            budgetTier: 'high',
        });

        expect(result.feasible).toBe(false);
        expect(result.travelDaysRequired).toBe(2); // 1 each way (≤12h)
        expect(result.allOvernight).toBe(false);
    });
});

describe('planTripDuration — short segment', () => {
    beforeEach(() => vi.clearAllMocks());

    it('2.5h → 0 travel days (merge)', async () => {
        getRouteTime.mockResolvedValue({ hours: 2.5, distanceKm: 80, source: 'osrm' });

        const result = await planTripDuration({
            startLocation: 'CityA',
            returnLocation: 'CityA',
            destinations: [{ location: 'CityB', days: 1 }],
            requestedDays: 1,
        });
        expect(result.travelDaysRequired).toBe(0);
        expect(result.feasible).toBe(true);
    });
});

describe('planTripDuration — edge cases', () => {
    it('empty destinations → feasible', async () => {
        const result = await planTripDuration({
            startLocation: 'Delhi',
            destinations: [],
            requestedDays: 3,
        });
        expect(result.feasible).toBe(true);
    });
});
