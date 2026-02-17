/**
 * Transport Engine — Unit Tests
 *
 * Tests: mode decisions, distance tiers, cost calculations, constraint matrix
 */
import { describe, it, expect } from 'vitest';
import {
    _decideTransportMode as decideTransportMode,
    _estimateDistanceTier as estimateDistanceTier,
    _calculateTransportCost as calculateTransportCost,
    _calculateAccommodationCost as calculateAccommodationCost,
    _KM_ESTIMATES as KM_ESTIMATES,
    _estimateDrivingTime as estimateDrivingTime,
} from '@/utils/transportEngine.js';

// ── decideTransportMode ─────────────────────────────────────────────

describe('decideTransportMode', () => {
    const makeTrip = (overrides = {}) => ({
        travel_preference: 'any',
        own_vehicle_type: 'none',
        travel_style: '',
        ...overrides,
    });

    // Rule 3: No flight when driving < 5 hours
    describe('Rule 3 — no-flight guard', () => {
        it('should NOT choose flight for local distances (auto mode)', () => {
            const mode = decideTransportMode(makeTrip(), 'local');
            expect(mode).not.toBe('flight');
        });

        it('should choose flight for short distances (300km = exactly 5h → >= 5h boundary)', () => {
            const mode = decideTransportMode(makeTrip(), 'short');
            // 300km / 60km/h = 5h exactly → triggers flight (>= 5h rule)
            expect(mode).toBe('flight');
        });

        it('should choose flight for long distances (auto mode)', () => {
            const mode = decideTransportMode(makeTrip(), 'long');
            expect(mode).toBe('flight');
        });

        it('should downgrade explicit flight request for very short distances', () => {
            const mode = decideTransportMode(
                makeTrip({ travel_preference: 'flight' }),
                'local'
            );
            expect(mode).toBe('train'); // downgraded
        });

        it('should honor explicit flight for medium distances', () => {
            const mode = decideTransportMode(
                makeTrip({ travel_preference: 'flight' }),
                'medium'
            );
            expect(mode).toBe('flight');
        });
    });

    // Rule 4: Own vehicle prioritized when feasible
    describe('Rule 4 — own vehicle priority', () => {
        it('should use own car for short distances', () => {
            const mode = decideTransportMode(
                makeTrip({ own_vehicle_type: 'car' }),
                'short'
            );
            expect(mode).toBe('car');
        });

        it('should use own bike for short distances', () => {
            const mode = decideTransportMode(
                makeTrip({ own_vehicle_type: 'bike' }),
                'short'
            );
            expect(mode).toBe('bike');
        });

        it('should NOT use own vehicle for long distances (> 6h drive)', () => {
            const mode = decideTransportMode(
                makeTrip({ own_vehicle_type: 'car' }),
                'long'
            );
            expect(mode).not.toBe('car');
        });
    });

    // Road trip mode
    describe('road_trip style', () => {
        it('should use own vehicle in road trip mode', () => {
            const mode = decideTransportMode(
                makeTrip({ travel_style: 'road_trip', own_vehicle_type: 'car' }),
                'short'
            );
            expect(mode).toBe('car');
        });

        it('should NEVER choose flight in road trip mode', () => {
            const mode = decideTransportMode(
                makeTrip({ travel_style: 'road_trip', own_vehicle_type: 'none' }),
                'long'
            );
            expect(mode).not.toBe('flight');
        });

        it('should use bus/train for no-vehicle road trips', () => {
            const mode = decideTransportMode(
                makeTrip({ travel_style: 'road_trip', own_vehicle_type: 'none' }),
                'local'
            );
            expect(['bus', 'train']).toContain(mode);
        });
    });

    // Auto-mode distance-tier decisions
    describe('auto-mode tier decisions', () => {
        it('should choose bus for local', () => {
            expect(decideTransportMode(makeTrip(), 'local')).toBe('bus');
        });

        it('should choose flight for short (300km = 5h exactly → hits >= 5h threshold)', () => {
            expect(decideTransportMode(makeTrip(), 'short')).toBe('flight');
        });

        it('should choose flight for medium (1000km >> 5h → flight)', () => {
            expect(decideTransportMode(makeTrip(), 'medium')).toBe('flight');
        });
    });
});

// ── estimateDistanceTier ────────────────────────────────────────────

describe('estimateDistanceTier', () => {
    it('should return "short" for known same-region cities (e.g., Hyderabad → Vizag)', () => {
        const tier = estimateDistanceTier('Hyderabad', 'Visakhapatnam');
        expect(['local', 'short']).toContain(tier);
    });

    it('should return "long" for very distant cities (e.g., Mumbai → Tokyo)', () => {
        const tier = estimateDistanceTier('Mumbai', 'Tokyo');
        expect(tier).toBe('long');
    });

    it('should default to "short" for unknown cities', () => {
        const tier = estimateDistanceTier('UnknownCityA', 'UnknownCityB');
        expect(tier).toBe('short');
    });

    it('should handle same city → local', () => {
        const tier = estimateDistanceTier('Delhi', 'Delhi');
        expect(['local', 'short']).toContain(tier);
    });
});

// ── estimateDrivingTime ─────────────────────────────────────────────

describe('estimateDrivingTime', () => {
    it('should return correct hours at 60km/h average', () => {
        expect(estimateDrivingTime(300)).toBe(5);
        expect(estimateDrivingTime(120)).toBe(2);
        expect(estimateDrivingTime(60)).toBe(1);
    });

    it('should return 0 for 0km', () => {
        expect(estimateDrivingTime(0)).toBe(0);
    });
});

// ── calculateTransportCost ──────────────────────────────────────────

describe('calculateTransportCost', () => {
    it('should scale cost by number of travelers', () => {
        const cost1 = calculateTransportCost('train', 'short', 1, 'USD');
        const cost2 = calculateTransportCost('train', 'short', 2, 'USD');
        expect(cost2).toBe(cost1 * 2);
    });

    it('should apply currency multiplier', () => {
        const costUSD = calculateTransportCost('train', 'short', 1, 'USD');
        const costINR = calculateTransportCost('train', 'short', 1, 'INR');
        expect(costINR).toBeGreaterThan(costUSD);
    });

    it('should use per-km calculation for car/bike', () => {
        const carCost = calculateTransportCost('car', 'short', 1, 'USD');
        // 300km * 0.08/km = 24
        expect(carCost).toBe(24);
    });

    it('should return a positive number for all valid inputs', () => {
        const modes = ['flight', 'train', 'bus', 'car', 'bike'];
        const tiers = ['local', 'short', 'medium', 'long'];
        for (const mode of modes) {
            for (const tier of tiers) {
                const cost = calculateTransportCost(mode, tier, 1, 'USD');
                expect(cost).toBeGreaterThan(0);
            }
        }
    });
});

// ── calculateAccommodationCost ──────────────────────────────────────

describe('calculateAccommodationCost', () => {
    it('should return higher cost for luxury vs budget', () => {
        const budget = calculateAccommodationCost('budget', 'USD');
        const luxury = calculateAccommodationCost('luxury', 'USD');
        expect(luxury).toBeGreaterThan(budget);
    });

    it('should apply currency multiplier', () => {
        const costUSD = calculateAccommodationCost('mid-range', 'USD');
        const costINR = calculateAccommodationCost('mid-range', 'INR');
        expect(costINR).toBeGreaterThan(costUSD);
    });
});

// ── KM_ESTIMATES ────────────────────────────────────────────────────

describe('KM_ESTIMATES', () => {
    it('should have increasing km values across tiers', () => {
        expect(KM_ESTIMATES.local).toBeLessThan(KM_ESTIMATES.short);
        expect(KM_ESTIMATES.short).toBeLessThan(KM_ESTIMATES.medium);
        expect(KM_ESTIMATES.medium).toBeLessThan(KM_ESTIMATES.long);
    });
});
