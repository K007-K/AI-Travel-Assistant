/**
 * Trip Duration Planner — Unit Tests
 */
import { describe, it, expect } from 'vitest';
import {
    planTripDuration,
    _HOURS_PER_TRAVEL_DAY as HOURS_PER_TRAVEL_DAY,
    _STYLE_MIN_HOURS as STYLE_MIN_HOURS,
} from '@/engine/tripDurationPlanner.js';

// ── Single Destination ───────────────────────────────────────────────

describe('planTripDuration — single destination', () => {
    it('should be feasible for same-city trip', () => {
        const result = planTripDuration({
            startLocation: 'Tirupati',
            returnLocation: 'Tirupati',
            destinations: [{ location: 'Tirupati', days: 2 }],
            requestedDays: 2,
        });

        expect(result.feasible).toBe(true);
        expect(result.travelDays).toBe(0);
        expect(result.explorationDays).toBe(2);
        expect(result.suggestedDays).toBe(2);
    });

    it('should add travel days for intercity trip', () => {
        // Visakhapatnam → Tirupati is 'short' tier (~300km, 5h driving)
        // Math.ceil(5/6) = 1 travel day each way = 2 travel days
        const result = planTripDuration({
            startLocation: 'Visakhapatnam',
            returnLocation: 'Visakhapatnam',
            destinations: [{ location: 'Tirupati', days: 2 }],
            requestedDays: 2,
        });

        expect(result.feasible).toBe(false);
        expect(result.travelDays).toBeGreaterThanOrEqual(1);
        expect(result.suggestedDays).toBeGreaterThan(2);
        expect(result.explorationDays).toBe(2);
    });

    it('should be feasible when enough days are requested', () => {
        const result = planTripDuration({
            startLocation: 'Visakhapatnam',
            returnLocation: 'Visakhapatnam',
            destinations: [{ location: 'Tirupati', days: 2 }],
            requestedDays: 5, // plenty of days
        });

        expect(result.feasible).toBe(true);
        expect(result.suggestedDays).toBe(5);
    });
});

// ── Multi-destination ────────────────────────────────────────────────

describe('planTripDuration — multi-destination', () => {
    it('should calculate travel days between multiple cities', () => {
        const result = planTripDuration({
            startLocation: 'Hyderabad',
            returnLocation: 'Hyderabad',
            destinations: [
                { location: 'Visakhapatnam', days: 2 },
                { location: 'Tirupati', days: 1 },
            ],
            requestedDays: 3,
        });

        // Need travel: Hyd→Vizag + Vizag→Tirupati + Tirupati→Hyd
        expect(result.travelDays).toBeGreaterThanOrEqual(2);
        expect(result.explorationDays).toBe(3);
        expect(result.feasible).toBe(false);
        expect(result.suggestedDays).toBeGreaterThan(3);
    });

    it('should include segment details', () => {
        const result = planTripDuration({
            startLocation: 'Delhi',
            returnLocation: 'Delhi',
            destinations: [
                { location: 'Jaipur', days: 2 },
                { location: 'Agra', days: 1 },
            ],
            requestedDays: 5,
        });

        // Should have travel segments
        expect(result.segments.length).toBeGreaterThanOrEqual(2);
        expect(result.segments[0]).toHaveProperty('from');
        expect(result.segments[0]).toHaveProperty('to');
        expect(result.segments[0]).toHaveProperty('hours');
    });
});

// ── Restructured Plan ────────────────────────────────────────────────

describe('planTripDuration — restructured plan', () => {
    it('should generate TRAVEL and EXPLORE days in correct order', () => {
        const result = planTripDuration({
            startLocation: 'Hyderabad',
            returnLocation: 'Hyderabad',
            destinations: [
                { location: 'Visakhapatnam', days: 2 },
            ],
            requestedDays: 2,
        });

        const plan = result.restructuredPlan;
        expect(plan.length).toBeGreaterThanOrEqual(3); // travel + 2 explore (+ return)

        // First entry should be TRAVEL
        expect(plan[0].type).toBe('TRAVEL');

        // Explore days should follow
        const exploreDays = plan.filter(d => d.type === 'EXPLORE');
        expect(exploreDays.length).toBe(2);
        expect(exploreDays[0].location).toBe('Visakhapatnam');
    });
});

// ── Edge cases ───────────────────────────────────────────────────────

describe('planTripDuration — edge cases', () => {
    it('should handle empty destinations', () => {
        const result = planTripDuration({
            startLocation: 'Delhi',
            returnLocation: 'Delhi',
            destinations: [],
            requestedDays: 3,
        });

        expect(result.feasible).toBe(true);
        expect(result.travelDays).toBe(0);
    });

    it('should handle no return location', () => {
        const result = planTripDuration({
            startLocation: 'Delhi',
            destinations: [{ location: 'Jaipur', days: 2 }],
            requestedDays: 3,
        });

        // Should still work, using startLocation as return
        expect(result).toHaveProperty('feasible');
    });

    it('should have correct HOURS_PER_TRAVEL_DAY constant', () => {
        expect(HOURS_PER_TRAVEL_DAY).toBe(6);
    });

    it('should have style min hours', () => {
        expect(STYLE_MIN_HOURS.relaxation).toBe(4);
        expect(STYLE_MIN_HOURS.business).toBe(3);
    });
});
