/**
 * Travel Timeline Builder — Unit Tests (OSRM-powered)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/api/routeTime.js', () => ({
    getRouteTime: vi.fn(),
}));

import { buildTravelTimeline } from '@/engine/travelTimelineBuilder.js';
import { getRouteTime } from '@/api/routeTime.js';

describe('buildTravelTimeline', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return empty for no destinations', async () => {
        const timeline = await buildTravelTimeline({
            startLocation: 'Delhi',
            returnLocation: 'Delhi',
            destinations: [],
        });
        expect(timeline).toEqual([]);
    });

    it('should return EXPLORE-only for same-city trip', async () => {
        const timeline = await buildTravelTimeline({
            startLocation: 'Tirupati',
            returnLocation: 'Tirupati',
            destinations: [{ location: 'Tirupati', days: 2 }],
        });
        expect(timeline.length).toBe(2);
        expect(timeline.every(t => t.type === 'EXPLORE')).toBe(true);
        expect(getRouteTime).not.toHaveBeenCalled();
    });

    it('should insert TRAVEL days for intercity trip (OSRM)', async () => {
        // 9.4h each way → ceil(9.4/6)=2 travel days each way
        getRouteTime.mockResolvedValue({ hours: 9.4, distanceKm: 766, source: 'osrm' });

        const timeline = await buildTravelTimeline({
            startLocation: 'Visakhapatnam',
            returnLocation: 'Visakhapatnam',
            destinations: [{ location: 'Tirupati', days: 1 }],
        });

        const travelDays = timeline.filter(t => t.type === 'TRAVEL');
        const exploreDays = timeline.filter(t => t.type === 'EXPLORE');

        expect(travelDays.length).toBe(4); // 2 outbound + 2 return
        expect(exploreDays.length).toBe(1);
        expect(timeline[0].type).toBe('TRAVEL');
        expect(travelDays[0].source).toBe('osrm');
        expect(travelDays[0].distanceKm).toBe(766);
    });

    it('should NOT insert travel day for ≤3h segments', async () => {
        getRouteTime.mockResolvedValue({ hours: 2.0, distanceKm: 50, source: 'osrm' });

        const timeline = await buildTravelTimeline({
            startLocation: 'CityA',
            returnLocation: 'CityA',
            destinations: [{ location: 'CityB', days: 2 }],
        });

        // ≤3h → no travel days, just EXPLORE
        expect(timeline.length).toBe(2);
        expect(timeline.every(t => t.type === 'EXPLORE')).toBe(true);
    });

    it('should mark arrivalNextDay for >10h', async () => {
        getRouteTime.mockResolvedValue({ hours: 12, distanceKm: 1200, source: 'osrm' });

        const timeline = await buildTravelTimeline({
            startLocation: 'Delhi',
            returnLocation: 'Delhi',
            destinations: [{ location: 'Mumbai', days: 1 }],
        });

        const travelDays = timeline.filter(t => t.type === 'TRAVEL');
        expect(travelDays[0].arrivalNextDay).toBe(true);
    });

    it('should have sequential day_number', async () => {
        getRouteTime.mockResolvedValue({ hours: 5, distanceKm: 300, source: 'osrm' });

        const timeline = await buildTravelTimeline({
            startLocation: 'CityA',
            returnLocation: 'CityA',
            destinations: [{ location: 'CityB', days: 1 }],
        });

        timeline.forEach((t, i) => {
            expect(t.day_number).toBe(i + 1);
        });
    });
});
