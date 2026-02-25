/**
 * Trip Duration Planner — Unit Tests (OSRM-powered)
 *
 * Note: These tests mock getRouteTime to avoid real OSRM calls.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the routeTime module BEFORE importing the planner
vi.mock('@/api/routeTime.js', () => ({
    getRouteTime: vi.fn(),
}));

import { planTripDuration } from '@/engine/tripDurationPlanner.js';
import { getRouteTime } from '@/api/routeTime.js';

describe('planTripDuration — same-city', () => {
    it('should be feasible immediately (no expansion, no API call)', async () => {
        const result = await planTripDuration({
            startLocation: 'Tirupati',
            returnLocation: 'Tirupati',
            destinations: [{ location: 'Tirupati', days: 2 }],
            requestedDays: 2,
        });
        expect(result.feasible).toBe(true);
        expect(result.travelDaysRequired).toBe(0);
        expect(result.explorationDays).toBe(2);
        expect(getRouteTime).not.toHaveBeenCalled();
    });
});

describe('planTripDuration — single destination intercity', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should require travel days for long routes (OSRM hours)', async () => {
        // Mock: Vizag→Tirupati = 9.4h, Tirupati→Vizag = 9.4h
        getRouteTime.mockResolvedValue({ hours: 9.4, distanceKm: 766, source: 'osrm' });

        const result = await planTripDuration({
            startLocation: 'Visakhapatnam',
            returnLocation: 'Visakhapatnam',
            destinations: [{ location: 'Tirupati', days: 1 }],
            requestedDays: 1,
        });

        // 9.4h > 3h → ceil(9.4/6) = 2 travel days each way = 4 travel days
        expect(result.feasible).toBe(false);
        expect(result.travelDaysRequired).toBe(4);
        expect(result.explorationDays).toBe(1);
        expect(result.suggestedDays).toBe(5);
        expect(result.segments[0].source).toBe('osrm');
    });

    it('should be feasible when enough days requested', async () => {
        getRouteTime.mockResolvedValue({ hours: 9.4, distanceKm: 766, source: 'osrm' });

        const result = await planTripDuration({
            startLocation: 'Visakhapatnam',
            returnLocation: 'Visakhapatnam',
            destinations: [{ location: 'Tirupati', days: 1 }],
            requestedDays: 5,
        });
        expect(result.feasible).toBe(true);
    });
});

describe('planTripDuration — short segment merge', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should NOT add travel day for ≤3h segments', async () => {
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

describe('planTripDuration — multi-destination', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should sum travel between all cities', async () => {
        // Hyd→Vizag: 8h, Vizag→Tirupati: 9.4h, Tirupati→Hyd: 12h
        getRouteTime
            .mockResolvedValueOnce({ hours: 8, distanceKm: 600, source: 'osrm' })
            .mockResolvedValueOnce({ hours: 9.4, distanceKm: 766, source: 'osrm' })
            .mockResolvedValueOnce({ hours: 12, distanceKm: 560, source: 'osrm' });

        const result = await planTripDuration({
            startLocation: 'Hyderabad',
            returnLocation: 'Hyderabad',
            destinations: [
                { location: 'Visakhapatnam', days: 2 },
                { location: 'Tirupati', days: 1 },
            ],
            requestedDays: 3,
        });
        expect(result.explorationDays).toBe(3);
        // ceil(8/6)=2 + ceil(9.4/6)=2 + ceil(12/6)=2 = 6 travel days
        expect(result.travelDaysRequired).toBe(6);
        expect(result.feasible).toBe(false);
        expect(result.segments.length).toBe(3);
    });
});

describe('planTripDuration — edge cases', () => {
    it('should handle empty destinations', async () => {
        const result = await planTripDuration({
            startLocation: 'Delhi',
            destinations: [],
            requestedDays: 3,
        });
        expect(result.feasible).toBe(true);
        expect(result.travelDaysRequired).toBe(0);
    });

    it('should include reason when infeasible', async () => {
        getRouteTime.mockResolvedValue({ hours: 9.4, distanceKm: 766, source: 'osrm' });

        const result = await planTripDuration({
            startLocation: 'Visakhapatnam',
            returnLocation: 'Visakhapatnam',
            destinations: [{ location: 'Tirupati', days: 1 }],
            requestedDays: 1,
        });
        expect(result.reason).toBeTruthy();
        expect(result.reason).toContain('requires');
    });
});
