/**
 * Travel Timeline Builder — Unit Tests (Overnight + Tiered Formula)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/api/routeTime.js', () => ({
    getRouteTime: vi.fn(),
}));

import { buildTravelTimeline } from '@/engine/travelTimelineBuilder.js';
import { getRouteTime } from '@/api/routeTime.js';

describe('buildTravelTimeline', () => {
    beforeEach(() => vi.clearAllMocks());

    it('empty destinations → empty', async () => {
        const tl = await buildTravelTimeline({ startLocation: 'A', destinations: [] });
        expect(tl).toEqual([]);
    });

    it('same-city → EXPLORE only', async () => {
        const tl = await buildTravelTimeline({
            startLocation: 'Tirupati',
            returnLocation: 'Tirupati',
            destinations: [{ location: 'Tirupati', days: 2 }],
        });
        expect(tl.length).toBe(2);
        expect(tl.every(t => t.type === 'EXPLORE')).toBe(true);
    });

    it('overnight 9.4h budget → 0 TRAVEL days, overnightArrival on explore', async () => {
        getRouteTime.mockResolvedValue({ hours: 9.4, distanceKm: 766, source: 'osrm' });

        const tl = await buildTravelTimeline({
            startLocation: 'Vizag',
            returnLocation: 'Vizag',
            destinations: [{ location: 'Tirupati', days: 1 }],
            budgetTier: 'low',
        });

        // 0 TRAVEL days (overnight both ways)
        expect(tl.filter(t => t.type === 'TRAVEL').length).toBe(0);
        expect(tl.filter(t => t.type === 'EXPLORE').length).toBe(1);
        // First explore day has overnightArrival metadata
        expect(tl[0].overnightArrival).toBeTruthy();
        expect(tl[0].overnightArrival.from).toBe('Vizag');
    });

    it('non-overnight 5h → 1 TRAVEL day each way', async () => {
        getRouteTime.mockResolvedValue({ hours: 5, distanceKm: 300, source: 'osrm' });

        const tl = await buildTravelTimeline({
            startLocation: 'A',
            returnLocation: 'A',
            destinations: [{ location: 'B', days: 1 }],
            budgetTier: 'mid',
        });

        // 5h not overnight eligible → 1 TRAVEL each way
        expect(tl.filter(t => t.type === 'TRAVEL').length).toBe(2);
        expect(tl.filter(t => t.type === 'EXPLORE').length).toBe(1);
    });

    it('sequential day numbering', async () => {
        getRouteTime.mockResolvedValue({ hours: 5, distanceKm: 300, source: 'osrm' });

        const tl = await buildTravelTimeline({
            startLocation: 'A',
            returnLocation: 'A',
            destinations: [{ location: 'B', days: 1 }],
            budgetTier: 'mid',
        });

        tl.forEach((t, i) => expect(t.day_number).toBe(i + 1));
    });
});
