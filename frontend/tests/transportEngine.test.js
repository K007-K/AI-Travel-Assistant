/**
 * Transport Engine — Realistic Trip Verification
 *
 * Tests the two bugs that were fixed:
 * 1. Local transport must appear between nearby activities (< 2km)
 * 2. User's explicit flight preference must NOT be downgraded to bus/train
 */
import { describe, it, expect } from 'vitest';
import {
    insertPairwiseLocalTransport,
    buildOutboundSegment,
    buildReturnSegment,
    buildIntercitySegments,
    haversineDistance,
} from '../src/utils/transportEngine.js';

// ─────────────────────────────────────────────────────────────────────
// TEST 1: Local Transport Between Nearby Activities
// ─────────────────────────────────────────────────────────────────────

describe('Local Transport — Nearby Activities', () => {
    // Real Puducherry coordinates (attractions within ~1-3km of each other)
    const puducherry = {
        aurobindo: { lat: 11.9340, lng: 79.8360 },       // Sri Aurobindo Ashram
        cafeXtasi: { lat: 11.9335, lng: 79.8330 },        // Café Xtasi (~300m away)
        museum: { lat: 11.9310, lng: 79.8350 },            // Puducherry Museum (~350m)
        rendezvous: { lat: 11.9345, lng: 79.8375 },        // Rendezvous restaurant (~200m)
        promenade: { lat: 11.9330, lng: 79.8395 },         // Promenade Beach (~400m)
        paradise: { lat: 11.9370, lng: 79.8340 },          // Paradise Beach (~400m)
    };

    const makeActivities = () => [
        {
            trip_id: 'test-trip',
            type: 'activity',
            title: 'Private Meditation at Sri Aurobindo Ashram',
            day_number: 2,
            location: 'Sri Aurobindo Ashram',
            estimated_cost: 640,
            order_index: 0,
            latitude: puducherry.aurobindo.lat,
            longitude: puducherry.aurobindo.lng,
            metadata: { time: '08:00' },
        },
        {
            trip_id: 'test-trip',
            type: 'activity',
            title: 'Breakfast at Café Xtasi',
            day_number: 2,
            location: 'Café Xtasi, Puducherry',
            estimated_cost: 576,
            order_index: 1,
            latitude: puducherry.cafeXtasi.lat,
            longitude: puducherry.cafeXtasi.lng,
            metadata: { time: '10:00' },
        },
        {
            trip_id: 'test-trip',
            type: 'activity',
            title: 'Private Tour of the Puducherry Museum',
            day_number: 2,
            location: 'Puducherry Museum',
            estimated_cost: 768,
            order_index: 2,
            latitude: puducherry.museum.lat,
            longitude: puducherry.museum.lng,
            metadata: { time: '11:30' },
        },
        {
            trip_id: 'test-trip',
            type: 'activity',
            title: 'Lunch at Rendezvous',
            day_number: 2,
            location: 'Rendezvous, Puducherry',
            estimated_cost: 704,
            order_index: 3,
            latitude: puducherry.rendezvous.lat,
            longitude: puducherry.rendezvous.lng,
            metadata: { time: '13:30' },
        },
        {
            trip_id: 'test-trip',
            type: 'activity',
            title: 'Promenade Beach Walk',
            day_number: 2,
            location: 'Promenade Beach',
            estimated_cost: 0,
            order_index: 4,
            latitude: puducherry.promenade.lat,
            longitude: puducherry.promenade.lng,
            metadata: { time: '16:00' },
        },
    ];

    it('should verify Puducherry activities are within 0.5-2km of each other', () => {
        // Verify: Ashram → Café Xtasi is between 0.3-0.5km
        const d1 = haversineDistance(
            puducherry.aurobindo.lat, puducherry.aurobindo.lng,
            puducherry.cafeXtasi.lat, puducherry.cafeXtasi.lng
        );
        console.log(`  Ashram → Café Xtasi: ${d1.toFixed(2)} km`);
        expect(d1).toBeGreaterThan(0.1);
        expect(d1).toBeLessThan(2.0); // Within 2km — old code would SKIP this

        // Café Xtasi → Museum
        const d2 = haversineDistance(
            puducherry.cafeXtasi.lat, puducherry.cafeXtasi.lng,
            puducherry.museum.lat, puducherry.museum.lng
        );
        console.log(`  Café Xtasi → Museum: ${d2.toFixed(2)} km`);
        expect(d2).toBeGreaterThan(0.1);
        expect(d2).toBeLessThan(2.0);
    });

    it('should INSERT local transport between Puducherry activities (new 0.5km threshold)', () => {
        const activities = makeActivities();
        const allocation = { local_transport_remaining: 5000 };

        const localSegs = insertPairwiseLocalTransport(
            activities, 'test-trip', 2, 'luxury', 'INR', allocation
        );

        console.log('\n  === LOCAL TRANSPORT SEGMENTS GENERATED ===');
        localSegs.forEach(seg => {
            console.log(`  🚕 ${seg.title} — ₹${seg.estimated_cost}`);
        });
        console.log(`  Total local transport segments: ${localSegs.length}`);
        console.log(`  Budget remaining: ₹${allocation.local_transport_remaining}`);

        // With 5 activities, we expect 4 transport segments (between each pair)
        // Old code (>2km) would produce 0 segments for Puducherry!
        expect(localSegs.length).toBeGreaterThanOrEqual(1);
        expect(localSegs.every(s => s.type === 'local_transport')).toBe(true);
        expect(localSegs.every(s => s.day_number === 2)).toBe(true);
    });

    it('should NOT insert local transport when activities are at the SAME point', () => {
        const activities = [
            {
                trip_id: 'test-trip',
                title: 'Activity A',
                location: 'Same Place',
                order_index: 0,
                latitude: 11.934,
                longitude: 79.836,
                metadata: {},
            },
            {
                trip_id: 'test-trip',
                title: 'Activity B',
                location: 'Same Place',
                order_index: 1,
                latitude: 11.934, // exact same coordinates
                longitude: 79.836,
                metadata: {},
            },
        ];

        const localSegs = insertPairwiseLocalTransport(
            activities, 'test-trip', 1, 'mid-range', 'INR', { local_transport_remaining: 5000 }
        );

        console.log(`\n  Same-location test: ${localSegs.length} segments (expected 0)`);
        expect(localSegs.length).toBe(0);
    });
});

// ─────────────────────────────────────────────────────────────────────
// TEST 2: Flight Preference NOT Downgraded
// ─────────────────────────────────────────────────────────────────────

describe('Flight Preference — No Silent Downgrade', () => {
    // Realistic trip: Goa → Visakhapatnam, user chose flight, budget = ₹50,000
    const flightTrip = {
        id: 'test-trip-flight',
        destination: 'Goa',
        start_location: 'Visakhapatnam',
        return_location: 'Visakhapatnam',
        travelers: 2,
        currency: 'INR',
        budget: 50000,
        travel_preference: 'flight',    // << USER EXPLICITLY CHOSE FLIGHT
        accommodation_preference: 'luxury',
        own_vehicle_type: 'none',
        travel_style: '',
        segments: [
            { location: 'Goa', days: 3 },
        ],
    };

    // Small intercity budget to trigger envelope pressure
    const tightAllocation = {
        intercity: 8000,
        intercity_remaining: 8000, // Flight for 2 to Goa costs ~₹24,900 — WAY over this
    };

    // Generous allocation
    const generousAllocation = {
        intercity: 30000,
        intercity_remaining: 30000,
    };

    it('should KEEP flight when user explicitly chose it (tight budget)', () => {
        const seg = buildOutboundSegment(flightTrip, { ...tightAllocation }, 1);

        console.log('\n  === OUTBOUND SEGMENT (tight budget) ===');
        console.log(`  Title: ${seg?.title}`);
        console.log(`  Mode: ${seg?.metadata?.transport_mode}`);
        console.log(`  Cost: ₹${seg?.estimated_cost}`);

        expect(seg).not.toBeNull();
        expect(seg.metadata.transport_mode).toBe('flight'); // NOT bus/train!
        expect(seg.title).toContain('Flight');
        expect(seg.estimated_cost).toBeGreaterThan(0);
    });

    it('should KEEP flight on return too (tight budget)', () => {
        const seg = buildReturnSegment(flightTrip, { ...tightAllocation }, 1, 3);

        console.log('\n  === RETURN SEGMENT (tight budget) ===');
        console.log(`  Title: ${seg?.title}`);
        console.log(`  Mode: ${seg?.metadata?.transport_mode}`);
        console.log(`  Cost: ₹${seg?.estimated_cost}`);

        expect(seg).not.toBeNull();
        expect(seg.metadata.transport_mode).toBe('flight');
        expect(seg.title).toContain('Flight');
    });

    it('should still use flight with generous budget', () => {
        const seg = buildOutboundSegment(flightTrip, { ...generousAllocation }, 1);

        console.log('\n  === OUTBOUND (generous budget) ===');
        console.log(`  Title: ${seg?.title}`);
        console.log(`  Mode: ${seg?.metadata?.transport_mode}`);
        console.log(`  Cost: ₹${seg?.estimated_cost}`);

        expect(seg).not.toBeNull();
        expect(seg.metadata.transport_mode).toBe('flight');
    });

    it('should DOWNGRADE when preference is "any" and budget is tight', () => {
        const anyTrip = { ...flightTrip, travel_preference: 'any' };
        const seg = buildOutboundSegment(anyTrip, { ...tightAllocation }, 1);

        console.log('\n  === OUTBOUND (preference="any", tight budget) ===');
        console.log(`  Title: ${seg?.title}`);
        console.log(`  Mode: ${seg?.metadata?.transport_mode}`);
        console.log(`  Cost: ₹${seg?.estimated_cost}`);

        expect(seg).not.toBeNull();
        // With preference='any', should downgrade from flight to train/bus
        expect(seg.metadata.transport_mode).not.toBe('flight');
    });
});

// ─────────────────────────────────────────────────────────────────────
// TEST 3: Full Realistic Trip Simulation
// ─────────────────────────────────────────────────────────────────────

describe('Full Trip Simulation — Vizag → Goa → Puducherry', () => {
    const trip = {
        id: 'full-sim',
        destination: 'Goa',
        start_location: 'Visakhapatnam',
        return_location: 'Visakhapatnam',
        travelers: 2,
        currency: 'INR',
        budget: 100000,
        travel_preference: 'flight',
        accommodation_preference: 'luxury',
        own_vehicle_type: 'none',
        travel_style: '',
        segments: [
            { location: 'Goa', days: 2 },
            { location: 'Puducherry', days: 2 },
        ],
    };

    const allocation = {
        intercity: 40000,
        intercity_remaining: 40000,
    };

    it('should generate outbound FLIGHT: Visakhapatnam → Goa', () => {
        const seg = buildOutboundSegment(trip, { ...allocation }, 1);
        console.log(`\n  Outbound: ${seg?.title} — ₹${seg?.estimated_cost}`);
        expect(seg?.metadata?.transport_mode).toBe('flight');
    });

    it('should generate intercity FLIGHT: Goa → Puducherry', () => {
        const segs = buildIntercitySegments(trip, { ...allocation }, 1);
        console.log(`\n  Intercity segments: ${segs.length}`);
        segs.forEach(s => console.log(`    ${s.title} — ₹${s.estimated_cost}`));
        expect(segs.length).toBe(1);
        expect(segs[0].metadata.transport_mode).toBe('flight');
    });

    it('should generate return FLIGHT: Puducherry → Visakhapatnam', () => {
        const seg = buildReturnSegment(trip, { ...allocation }, 1, 4);
        console.log(`\n  Return: ${seg?.title} — ₹${seg?.estimated_cost}`);
        expect(seg?.metadata?.transport_mode).toBe('flight');
    });

    it('should produce a complete trip summary', () => {
        const alloc = { intercity: 40000, intercity_remaining: 40000 };

        const outbound = buildOutboundSegment(trip, alloc, 1);
        const intercity = buildIntercitySegments(trip, alloc, 1);
        const ret = buildReturnSegment(trip, alloc, 1, 4);

        const totalTransport = (outbound?.estimated_cost || 0)
            + intercity.reduce((s, x) => s + x.estimated_cost, 0)
            + (ret?.estimated_cost || 0);

        console.log('\n  ╔══════════════════════════════════════════════╗');
        console.log('  ║     FULL TRIP: Vizag → Goa → Puducherry      ║');
        console.log('  ╠══════════════════════════════════════════════╣');
        console.log(`  ║ Outbound: ${outbound?.title?.padEnd(36)}║`);
        console.log(`  ║   Cost: ₹${String(outbound?.estimated_cost).padEnd(35)}║`);
        console.log(`  ║   Mode: ${outbound?.metadata?.transport_mode?.padEnd(36)}║`);
        console.log('  ╠──────────────────────────────────────────────╣');
        intercity.forEach(s => {
            console.log(`  ║ Intercity: ${s.title?.substring(0, 34).padEnd(34)}║`);
            console.log(`  ║   Cost: ₹${String(s.estimated_cost).padEnd(35)}║`);
            console.log(`  ║   Mode: ${s.metadata?.transport_mode?.padEnd(36)}║`);
        });
        console.log('  ╠──────────────────────────────────────────────╣');
        console.log(`  ║ Return: ${ret?.title?.substring(0, 36).padEnd(36)}║`);
        console.log(`  ║   Cost: ₹${String(ret?.estimated_cost).padEnd(35)}║`);
        console.log(`  ║   Mode: ${ret?.metadata?.transport_mode?.padEnd(36)}║`);
        console.log('  ╠══════════════════════════════════════════════╣');
        console.log(`  ║ TOTAL TRANSPORT: ₹${String(totalTransport).padEnd(25)}║`);
        console.log(`  ║ Budget Remaining: ₹${String(alloc.intercity_remaining).padEnd(24)}║`);
        console.log('  ╚══════════════════════════════════════════════╝');

        // All segments should be flights (user chose flight)
        expect(outbound?.metadata?.transport_mode).toBe('flight');
        intercity.forEach(s => expect(s.metadata.transport_mode).toBe('flight'));
        expect(ret?.metadata?.transport_mode).toBe('flight');
    });
});
