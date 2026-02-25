/**
 * Travel Timeline Builder — Unit Tests
 */
import { describe, it, expect } from 'vitest';
import { buildTravelTimeline } from '@/engine/travelTimelineBuilder.js';

describe('buildTravelTimeline', () => {
    it('should return empty for no destinations', () => {
        const timeline = buildTravelTimeline({
            startLocation: 'Delhi',
            returnLocation: 'Delhi',
            destinations: [],
        });
        expect(timeline).toEqual([]);
    });

    it('should return EXPLORE-only for same-city trip', () => {
        const timeline = buildTravelTimeline({
            startLocation: 'Tirupati',
            returnLocation: 'Tirupati',
            destinations: [{ location: 'Tirupati', days: 2 }],
        });
        // Same city — no travel segments
        expect(timeline.length).toBe(2);
        expect(timeline.every(t => t.type === 'EXPLORE')).toBe(true);
    });

    it('should insert TRAVEL days for intercity trip', () => {
        const timeline = buildTravelTimeline({
            startLocation: 'Visakhapatnam',
            returnLocation: 'Visakhapatnam',
            destinations: [{ location: 'Tirupati', days: 1 }],
        });
        // Vizag→Tirupati: short tier (5h > 3h → 1 travel day)
        // 1 explore day
        // Tirupati→Vizag: 1 travel day
        const travelDays = timeline.filter(t => t.type === 'TRAVEL');
        const exploreDays = timeline.filter(t => t.type === 'EXPLORE');

        expect(travelDays.length).toBe(2);
        expect(exploreDays.length).toBe(1);
        expect(timeline[0].type).toBe('TRAVEL'); // outbound first
        expect(timeline[1].type).toBe('EXPLORE');
        expect(timeline[2].type).toBe('TRAVEL'); // return last
    });

    it('should handle multi-destination', () => {
        const timeline = buildTravelTimeline({
            startLocation: 'Hyderabad',
            returnLocation: 'Hyderabad',
            destinations: [
                { location: 'Visakhapatnam', days: 2 },
                { location: 'Tirupati', days: 1 },
            ],
        });
        const travelDays = timeline.filter(t => t.type === 'TRAVEL');
        const exploreDays = timeline.filter(t => t.type === 'EXPLORE');

        expect(travelDays.length).toBeGreaterThanOrEqual(2);
        expect(exploreDays.length).toBe(3); // 2 + 1
    });

    it('should mark fullDay for >3h segments', () => {
        const timeline = buildTravelTimeline({
            startLocation: 'Visakhapatnam',
            returnLocation: 'Visakhapatnam',
            destinations: [{ location: 'Tirupati', days: 1 }],
        });
        const travelDays = timeline.filter(t => t.type === 'TRAVEL');
        expect(travelDays[0].fullDay).toBe(true);
    });

    it('should have sequential day_number', () => {
        const timeline = buildTravelTimeline({
            startLocation: 'Visakhapatnam',
            returnLocation: 'Visakhapatnam',
            destinations: [{ location: 'Tirupati', days: 1 }],
        });
        timeline.forEach((t, i) => {
            expect(t.day_number).toBe(i + 1);
        });
    });
});
