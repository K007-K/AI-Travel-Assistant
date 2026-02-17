/**
 * Constraint Compliance Test Suite
 * 
 * Tests that itinerary generation respects ALL user constraints:
 *   - Travel Style (road_trip, city_exploration, luxury_escape, backpacking, business_travel)
 *   - Travel Preference (any, flight, train, bus)
 *   - Accommodation Preference (budget, mid-range, luxury)
 *   - Own Vehicle (none, car, bike)
 *   - Distance Tiers (local, short, medium, long)
 *   - Budget Allocation Ratios
 *   - Real City Pair Distance Detection
 * 
 * Run with: node tests/constraintCompliance.test.mjs
 */

import {
    _decideTransportMode as decideTransportMode,
    _estimateDistanceTier as estimateDistanceTier,
    _KM_ESTIMATES as KM_ESTIMATES,
    _estimateDrivingTime as estimateDrivingTime,
} from '../src/utils/transportEngine.js';

// ── Inline Budget Allocator (avoids Supabase import chain) ───────────
// Copied from engine/budgetAllocator.js — pure logic only

const DEFAULT_RATIOS = {
    intercity: 0.20, accommodation: 0.30, local_transport: 0.05,
    activity: 0.35, buffer: 0.10,
};
const ROAD_TRIP_RATIOS = {
    intercity: 0.35, accommodation: 0.25, local_transport: 0.02,
    activity: 0.28, buffer: 0.10,
};
const LUXURY_RATIOS = {
    intercity: 0.15, accommodation: 0.35, local_transport: 0.05,
    activity: 0.30, buffer: 0.10, upgrade_pool: 0.05,
};

function allocateBudget(totalBudget, options = {}) {
    const {
        travelStyle = '', budgetTier = 'mid-range', totalDays = 1,
        totalNights = Math.max(0, totalDays - 1), travelers = 1,
        hasOwnVehicle = false,
    } = options;

    let ratios;
    if (travelStyle === 'road_trip') ratios = { ...ROAD_TRIP_RATIOS };
    else if (budgetTier === 'luxury') ratios = { ...LUXURY_RATIOS };
    else ratios = { ...DEFAULT_RATIOS };

    if (hasOwnVehicle && travelStyle !== 'road_trip') {
        const saved = ratios.intercity * 0.5;
        ratios.intercity -= saved;
        ratios.activity += saved;
    }

    const ratioSum = Object.values(ratios).reduce((s, v) => s + v, 0);
    Object.keys(ratios).forEach(k => { ratios[k] = ratios[k] / ratioSum; });

    const allocation = {
        total_budget: totalBudget,
        intercity: Math.round(totalBudget * ratios.intercity),
        accommodation: Math.round(totalBudget * ratios.accommodation),
        local_transport: Math.round(totalBudget * ratios.local_transport),
        activity: Math.round(totalBudget * ratios.activity),
        buffer: Math.round(totalBudget * ratios.buffer),
    };

    if (ratios.upgrade_pool) {
        allocation.upgrade_pool = Math.round(totalBudget * ratios.upgrade_pool);
    }

    allocation.activity_per_day = totalDays > 0 ? Math.round(allocation.activity / totalDays) : allocation.activity;
    allocation.accommodation_per_night = totalNights > 0 ? Math.round(allocation.accommodation / totalNights) : 0;
    allocation.intercity_remaining = allocation.intercity;
    allocation.accommodation_remaining = allocation.accommodation;
    allocation.local_transport_remaining = allocation.local_transport;
    allocation.activity_remaining = allocation.activity;
    allocation._meta = { ratios, travelStyle, budgetTier, totalDays, totalNights, travelers, hasOwnVehicle };

    const allocated = allocation.intercity + allocation.accommodation
        + allocation.local_transport + allocation.activity
        + allocation.buffer + (allocation.upgrade_pool || 0);
    if (allocated > totalBudget) allocation.buffer -= (allocated - totalBudget);

    return allocation;
}

// ── Test Infrastructure ──────────────────────────────────────────────

let totalTests = 0;
let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, testName, details = '') {
    totalTests++;
    if (condition) {
        passed++;
    } else {
        failed++;
        failures.push({ testName, details });
        console.log(`  ❌ FAIL: ${testName}${details ? ` — ${details}` : ''}`);
    }
}

function section(name) {
    console.log(`\n${'═'.repeat(70)}`);
    console.log(`  ${name}`);
    console.log(`${'═'.repeat(70)}`);
}

// ── Constants ────────────────────────────────────────────────────────

const TRAVEL_STYLES = ['road_trip', 'city_exploration', 'luxury_escape', 'backpacking', 'business_travel'];
const TRAVEL_PREFS = ['any', 'flight', 'train', 'bus'];
const ACCOM_PREFS = ['budget', 'mid-range', 'luxury'];
const VEHICLES = ['none', 'car', 'bike'];
const DISTANCE_TIERS = ['local', 'short', 'medium', 'long'];

// City pairs for distance testing
const CITY_PAIRS = [
    { from: 'Hyderabad', to: 'Goa', expectedMinTier: 'short' },
    { from: 'Delhi', to: 'Mumbai', expectedMinTier: 'short' },
    { from: 'Delhi', to: 'Jaipur', expectedMinTier: 'short' },
    { from: 'Bangalore', to: 'Chennai', expectedMinTier: 'short' },
    { from: 'Mumbai', to: 'Pune', expectedMinTier: 'short' },
    { from: 'Kochi', to: 'Munnar', expectedMinTier: 'short' },
    { from: 'Paris', to: 'Lyon', expectedMinTier: 'short' },
    { from: 'Tokyo', to: 'Osaka', expectedMinTier: 'short' },
    { from: 'New York', to: 'Boston', expectedMinTier: 'short' },
    { from: 'London', to: 'Edinburgh', expectedMinTier: 'short' },
];

// ══════════════════════════════════════════════════════════════════════
//  SECTION 1: Transport Mode — Explicit Preference Respected
// ══════════════════════════════════════════════════════════════════════

section('§1 — Explicit Travel Preference Compliance');

for (const pref of ['flight', 'train', 'bus']) {
    for (const tier of DISTANCE_TIERS) {
        const trip = {
            travel_preference: pref,
            travel_style: 'city_exploration',
            own_vehicle_type: 'none',
        };
        const mode = decideTransportMode(trip, tier);
        const drivingHours = estimateDrivingTime(KM_ESTIMATES[tier]);

        if (pref === 'flight' && drivingHours < 2) {
            assert(mode === 'train',
                `flight + ${tier} (${drivingHours.toFixed(1)}h) → downgrade OK`,
                `got: ${mode}`);
        } else {
            assert(mode === pref,
                `Explicit ${pref} + ${tier} → must return ${pref}`,
                `got: ${mode} (driving: ${drivingHours.toFixed(1)}h)`);
        }
    }
}

// ══════════════════════════════════════════════════════════════════════
//  SECTION 2: Road Trip Style — Never Flight
// ══════════════════════════════════════════════════════════════════════

section('§2 — Road Trip: Flight NEVER Allowed');

for (const vehicle of VEHICLES) {
    for (const tier of DISTANCE_TIERS) {
        const trip = {
            travel_preference: 'any',
            travel_style: 'road_trip',
            own_vehicle_type: vehicle,
        };
        const mode = decideTransportMode(trip, tier);
        assert(mode !== 'flight',
            `road_trip + vehicle=${vehicle} + ${tier} → no flight`,
            `got: ${mode}`);
    }
}

// ══════════════════════════════════════════════════════════════════════
//  SECTION 3: Own Vehicle Priority (≤ 6h driving)
// ══════════════════════════════════════════════════════════════════════

section('§3 — Own Vehicle Used When Feasible (≤ 6h)');

for (const vehicle of ['car', 'bike']) {
    for (const tier of DISTANCE_TIERS) {
        const trip = {
            travel_preference: 'any',
            travel_style: 'city_exploration',
            own_vehicle_type: vehicle,
        };
        const mode = decideTransportMode(trip, tier);
        const drivingHours = estimateDrivingTime(KM_ESTIMATES[tier]);

        if (drivingHours <= 6) {
            assert(mode === vehicle,
                `own ${vehicle} + ${tier} (${drivingHours.toFixed(1)}h) → use own vehicle`,
                `got: ${mode}`);
        } else {
            assert(mode !== vehicle,
                `own ${vehicle} + ${tier} (${drivingHours.toFixed(1)}h) → too far, don't use own`,
                `got: ${mode}`);
        }
    }
}

// ══════════════════════════════════════════════════════════════════════
//  SECTION 4: Auto-decide (any) — Flight Only ≥ 5h
// ══════════════════════════════════════════════════════════════════════

section('§4 — Auto-decide: Flight Only When ≥ 5h Driving');

for (const tier of DISTANCE_TIERS) {
    const trip = {
        travel_preference: 'any',
        travel_style: 'city_exploration',
        own_vehicle_type: 'none',
    };
    const mode = decideTransportMode(trip, tier);
    const drivingHours = estimateDrivingTime(KM_ESTIMATES[tier]);

    if (drivingHours >= 5) {
        assert(mode === 'flight',
            `auto + ${tier} (${drivingHours.toFixed(1)}h) → should be flight`,
            `got: ${mode}`);
    } else {
        assert(mode !== 'flight',
            `auto + ${tier} (${drivingHours.toFixed(1)}h) → should NOT be flight`,
            `got: ${mode}`);
    }
}

// ══════════════════════════════════════════════════════════════════════
//  SECTION 5: Distance Tier — Real City Pairs
// ══════════════════════════════════════════════════════════════════════

section('§5 — Distance Tier Detection for Known City Pairs');

for (const { from, to, expectedMinTier } of CITY_PAIRS) {
    const tier = estimateDistanceTier(from, to);
    const validTiers = {
        'local': ['local', 'short', 'medium', 'long'],
        'short': ['short', 'medium', 'long'],
        'medium': ['medium', 'long'],
        'long': ['long'],
    };
    assert(validTiers[expectedMinTier].includes(tier),
        `${from} → ${to} ≥ ${expectedMinTier}`,
        `got: ${tier}`);
}

assert(estimateDistanceTier('Delhi', 'Delhi') === 'local',
    'Same city (Delhi → Delhi) → local',
    `got: ${estimateDistanceTier('Delhi', 'Delhi')}`);

// ══════════════════════════════════════════════════════════════════════
//  SECTION 6: Budget Allocation — Ratio Compliance
// ══════════════════════════════════════════════════════════════════════

section('§6 — Budget Allocation Correctness');

const BUDGETS = [5000, 15000, 50000, 200000];

for (const budget of BUDGETS) {
    for (const travelStyle of TRAVEL_STYLES) {
        for (const budgetTier of ACCOM_PREFS) {
            for (const hasOwnVehicle of [false, true]) {
                const alloc = allocateBudget(budget, {
                    travelStyle, budgetTier, totalDays: 3, totalNights: 2,
                    travelers: 2, hasOwnVehicle,
                });
                const label = `₹${budget}|${travelStyle}|${budgetTier}|veh=${hasOwnVehicle}`;

                // Sum ≤ total
                const sum = alloc.intercity + alloc.accommodation + alloc.local_transport
                    + alloc.activity + alloc.buffer + (alloc.upgrade_pool || 0);
                assert(sum <= alloc.total_budget, `${label}: sum ≤ total`, `sum=${sum}`);

                // No negatives
                assert(alloc.intercity >= 0, `${label}: intercity ≥ 0`);
                assert(alloc.accommodation >= 0, `${label}: accommodation ≥ 0`);
                assert(alloc.activity >= 0, `${label}: activity ≥ 0`);
                assert(alloc.buffer >= 0, `${label}: buffer ≥ 0`);

                // Own vehicle → less intercity
                if (hasOwnVehicle && travelStyle !== 'road_trip') {
                    const without = allocateBudget(budget, {
                        travelStyle, budgetTier, totalDays: 3, totalNights: 2,
                        travelers: 2, hasOwnVehicle: false,
                    });
                    assert(alloc.intercity <= without.intercity,
                        `${label}: own vehicle → less intercity`,
                        `with=${alloc.intercity}, without=${without.intercity}`);
                }

                // Luxury gets upgrade_pool (except road_trip which uses its own ratios)
                if (budgetTier === 'luxury' && travelStyle !== 'road_trip') {
                    assert(alloc.upgrade_pool > 0, `${label}: luxury → upgrade_pool`);
                }

                // Road trip → highest intercity ratio
                if (travelStyle === 'road_trip' && !hasOwnVehicle) {
                    const city = allocateBudget(budget, {
                        travelStyle: 'city_exploration', budgetTier, totalDays: 3,
                        totalNights: 2, travelers: 2, hasOwnVehicle: false,
                    });
                    assert(alloc.intercity >= city.intercity,
                        `${label}: road_trip intercity ≥ city`,
                        `rt=${alloc.intercity}, city=${city.intercity}`);
                }

                // Per-night and per-day derivation
                assert(alloc.accommodation_per_night === Math.round(alloc.accommodation / 2),
                    `${label}: per_night correct`);
                assert(alloc.activity_per_day === Math.round(alloc.activity / 3),
                    `${label}: per_day correct`);
            }
        }
    }
}

// ══════════════════════════════════════════════════════════════════════
//  SECTION 7: Full Constraint Matrix — Transport Decisions
// ══════════════════════════════════════════════════════════════════════

section('§7 — Full Constraint Matrix (240 combinations)');

let matrixTotal = 0;
let matrixPassed = 0;

for (const style of TRAVEL_STYLES) {
    for (const pref of TRAVEL_PREFS) {
        for (const vehicle of VEHICLES) {
            for (const tier of DISTANCE_TIERS) {
                matrixTotal++;
                const trip = { travel_preference: pref, travel_style: style, own_vehicle_type: vehicle };
                const mode = decideTransportMode(trip, tier);
                const drivingHours = estimateDrivingTime(KM_ESTIMATES[tier]);
                let ok = true;
                let reason = '';

                // Invariant 1: Road trip → never flight
                if (style === 'road_trip' && mode === 'flight') {
                    ok = false; reason = 'road_trip produced flight';
                }

                // Invariant 2: Explicit pref respected unless valid override
                if (pref !== 'any' && mode !== pref) {
                    const justified =
                        (style === 'road_trip') ||
                        (vehicle !== 'none' && drivingHours <= 6) ||
                        (pref === 'flight' && drivingHours < 2);
                    if (!justified) { ok = false; reason = `pref=${pref} got ${mode}`; }
                }

                // Invariant 3: Own vehicle ≤ 6h (non-road-trip)
                if (vehicle !== 'none' && drivingHours <= 6 && style !== 'road_trip') {
                    if (mode !== vehicle) { ok = false; reason = `own ${vehicle} ≤ 6h got ${mode}`; }
                }

                // Invariant 4: Valid mode
                if (!['flight', 'train', 'bus', 'car', 'bike'].includes(mode)) {
                    ok = false; reason = `invalid mode: ${mode}`;
                }

                if (ok) { matrixPassed++; } else {
                    totalTests++; failed++;
                    failures.push({
                        testName: `Matrix: ${style}|${pref}|${vehicle}|${tier}`,
                        details: reason + ` → mode=${mode}`
                    });
                    console.log(`  ❌ ${style}|${pref}|${vehicle}|${tier} → ${mode} — ${reason}`);
                }
            }
        }
    }
}

totalTests += matrixTotal;
passed += matrixPassed;
console.log(`\n  Matrix result: ${matrixPassed}/${matrixTotal} combinations valid`);

// ══════════════════════════════════════════════════════════════════════
//  SECTION 8: Edge Cases
// ══════════════════════════════════════════════════════════════════════

section('§8 — Edge Cases');

const z = allocateBudget(0, { totalDays: 3 });
assert(z.intercity === 0 && z.accommodation === 0, 'Zero budget → all zero');

const oneDay = allocateBudget(10000, { totalDays: 1, totalNights: 0 });
assert(oneDay.accommodation_per_night === 0, '1-day → 0 per_night');

assert(estimateDistanceTier(null, null) === 'short', 'null → default short');
assert(estimateDistanceTier('', '') === 'short', 'empty → default short');

const big = allocateBudget(10000000, { totalDays: 30, budgetTier: 'luxury' });
const bigSum = big.intercity + big.accommodation + big.local_transport
    + big.activity + big.buffer + (big.upgrade_pool || 0);
assert(bigSum <= 10000000, 'Large budget → no overflow', `sum=${bigSum}`);

// ══════════════════════════════════════════════════════════════════════
//  FINAL REPORT
// ══════════════════════════════════════════════════════════════════════

console.log(`\n${'═'.repeat(70)}`);
console.log(`  FINAL REPORT`);
console.log(`${'═'.repeat(70)}`);
console.log(`  Total Tests:  ${totalTests}`);
console.log(`  Passed:       ${passed}  ✅`);
console.log(`  Failed:       ${failed}  ${failed > 0 ? '❌' : '✅'}`);
console.log(`  Pass Rate:    ${((passed / totalTests) * 100).toFixed(1)}%`);

if (failures.length > 0) {
    console.log(`\n  ── Failures ──`);
    failures.forEach((f, i) => {
        console.log(`  ${i + 1}. ${f.testName}`);
        if (f.details) console.log(`     → ${f.details}`);
    });
}

console.log(`\n${'═'.repeat(70)}\n`);
process.exit(failed > 0 ? 1 : 0);
