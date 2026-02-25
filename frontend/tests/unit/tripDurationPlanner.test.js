/**
 * Trip Duration Planner — Unit Tests (Strict Realistic Mode)
 */
import { describe, it, expect } from 'vitest';
import {
    planTripDuration,
    _TIER_HOURS as TIER_HOURS,
} from '@/engine/tripDurationPlanner.js';

// ── Same-city trips ──────────────────────────────────────────────────

describe('planTripDuration — same-city', () => {
    it('should be feasible immediately (no expansion)', () => {
        const result = planTripDuration({
            startLocation: 'Tirupati',
            returnLocation: 'Tirupati',
            destinations: [{ location: 'Tirupati', days: 2 }],
            requestedDays: 2,
        });
        expect(result.feasible).toBe(true);
        expect(result.travelDaysRequired).toBe(0);
        expect(result.explorationDays).toBe(2);
    });
});

// ── Single destination intercity ─────────────────────────────────────

describe('planTripDuration — single destination intercity', () => {
    it('should require travel days for Vizag → Tirupati', () => {
        const result = planTripDuration({
            startLocation: 'Visakhapatnam',
            returnLocation: 'Visakhapatnam',
            destinations: [{ location: 'Tirupati', days: 1 }],
            requestedDays: 1,
        });
        // short tier = 5h > 3h → ceil(5/6)=1 travel day each way = 2 travel days
        expect(result.feasible).toBe(false);
        expect(result.travelDaysRequired).toBe(2);
        expect(result.explorationDays).toBe(1);
        expect(result.suggestedDays).toBe(3);
    });

    it('should be feasible when enough days requested', () => {
        const result = planTripDuration({
            startLocation: 'Visakhapatnam',
            returnLocation: 'Visakhapatnam',
            destinations: [{ location: 'Tirupati', days: 1 }],
            requestedDays: 5,
        });
        expect(result.feasible).toBe(true);
        expect(result.suggestedDays).toBe(5);
    });
});

// ── Short segments merge ─────────────────────────────────────────────

describe('planTripDuration — short segment merge', () => {
    it('should NOT add travel day for ≤3h segments', () => {
        // local tier = 0.5h → merges, no travel day
        const result = planTripDuration({
            startLocation: 'Tirupati',
            returnLocation: 'Tirupati',
            destinations: [{ location: 'Tirupati', days: 2 }],
            requestedDays: 2,
        });
        expect(result.travelDaysRequired).toBe(0);
        expect(result.feasible).toBe(true);
    });
});

// ── Multi-destination ────────────────────────────────────────────────

describe('planTripDuration — multi-destination', () => {
    it('should sum travel between all cities', () => {
        const result = planTripDuration({
            startLocation: 'Hyderabad',
            returnLocation: 'Hyderabad',
            destinations: [
                { location: 'Visakhapatnam', days: 2 },
                { location: 'Tirupati', days: 1 },
            ],
            requestedDays: 3,
        });
        expect(result.explorationDays).toBe(3);
        expect(result.travelDaysRequired).toBeGreaterThanOrEqual(2);
        expect(result.feasible).toBe(false);
        expect(result.segments.length).toBeGreaterThanOrEqual(2);
    });
});

// ── Edge cases ───────────────────────────────────────────────────────

describe('planTripDuration — edge cases', () => {
    it('should handle empty destinations', () => {
        const result = planTripDuration({
            startLocation: 'Delhi',
            destinations: [],
            requestedDays: 3,
        });
        expect(result.feasible).toBe(true);
        expect(result.travelDaysRequired).toBe(0);
    });

    it('should include reason when infeasible', () => {
        const result = planTripDuration({
            startLocation: 'Visakhapatnam',
            returnLocation: 'Visakhapatnam',
            destinations: [{ location: 'Tirupati', days: 1 }],
            requestedDays: 1,
        });
        expect(result.reason).toBeTruthy();
        expect(result.reason).toContain('requires');
    });

    it('should have correct TIER_HOURS', () => {
        expect(TIER_HOURS.short).toBe(5);
        expect(TIER_HOURS.medium).toBe(8);
        expect(TIER_HOURS.long).toBe(12);
        expect(TIER_HOURS.local).toBe(0.5);
    });
});
