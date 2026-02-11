/**
 * Transport Decision Engine
 * 
 * Deterministic, client-side utility that generates transport, accommodation,
 * and local commute trip_segments based on trip constraints.
 * 
 * NO AI calls — all costs come from lookup tables.
 */

// ── Cost Lookup Tables (base costs in USD, converted later) ──────────

const TRANSPORT_COSTS = {
    flight: { short: 80, medium: 150, long: 300 },   // < 500km, 500-2000km, > 2000km
    train: { short: 15, medium: 40, long: 80 },
    bus: { short: 8, medium: 20, long: 45 },
    car: { perKm: 0.08 },   // fuel cost per km
    bike: { perKm: 0.03 },
};

const ACCOMMODATION_COSTS = {
    budget: { perNight: 15 },
    'mid-range': { perNight: 60 },
    luxury: { perNight: 200 },
};

const LOCAL_TRANSPORT_COSTS = {
    budget: { perDay: 5 },
    'mid-range': { perDay: 15 },
    luxury: { perDay: 40 },
};

// ── Currency conversion rates (approximate, relative to USD) ─────────

const CURRENCY_MULTIPLIERS = {
    USD: 1, EUR: 0.92, GBP: 0.79, INR: 83, JPY: 149, AUD: 1.55,
    CAD: 1.37, SGD: 1.35, THB: 35, MYR: 4.7, KRW: 1330,
    BRL: 5, ZAR: 18, AED: 3.67, SAR: 3.75, CHF: 0.88,
    NZD: 1.67, SEK: 10.5, NOK: 10.8, DKK: 6.9, MXN: 17,
    PHP: 56, VND: 24500, IDR: 15600, TWD: 31.5, HKD: 7.8,
    CNY: 7.2, RUB: 92, TRY: 30, PLN: 4, CZK: 23,
    HUF: 360, ILS: 3.7, EGP: 31, PKR: 280, LKR: 320,
    BDT: 110, NPR: 133, MMK: 2100, KHR: 4100, LAK: 20500,
};

// ── Distance Estimation ──────────────────────────────────────────────

/**
 * Rough distance tier based on whether locations are in the same country / region.
 * Since we don't have geocoding, we use a heuristic:
 * - Same string → 0 (same city)
 * - Different strings → estimate based on common patterns
 */
function estimateDistanceTier(from, to) {
    if (!from || !to) return 'medium';

    const a = from.toLowerCase().trim();
    const b = to.toLowerCase().trim();

    if (a === b) return 'local';

    // If they share a country keyword, likely short distance
    const countryKeywords = [
        'india', 'usa', 'uk', 'japan', 'france', 'germany', 'italy', 'spain',
        'thailand', 'australia', 'brazil', 'mexico', 'canada', 'china',
    ];

    const aCountry = countryKeywords.find(c => a.includes(c));
    const bCountry = countryKeywords.find(c => b.includes(c));

    if (aCountry && bCountry && aCountry === bCountry) return 'short';

    // Check if both look like cities in the same region
    const sameRegionPairs = [
        ['delhi', 'mumbai'], ['delhi', 'jaipur'], ['mumbai', 'goa'], ['mumbai', 'pune'],
        ['bangalore', 'chennai'], ['bangalore', 'mysore'], ['hyderabad', 'bangalore'],
        ['paris', 'lyon'], ['paris', 'nice'], ['london', 'manchester'], ['london', 'edinburgh'],
        ['new york', 'boston'], ['new york', 'philadelphia'], ['los angeles', 'san francisco'],
        ['tokyo', 'osaka'], ['tokyo', 'kyoto'], ['bangkok', 'chiang mai'], ['bangkok', 'phuket'],
        ['sydney', 'melbourne'], ['rome', 'florence'], ['rome', 'venice'],
        ['berlin', 'munich'], ['barcelona', 'madrid'],
    ];

    const isShort = sameRegionPairs.some(([x, y]) =>
        (a.includes(x) && b.includes(y)) || (a.includes(y) && b.includes(x))
    );

    if (isShort) return 'short';

    // Default to medium for different cities
    return 'medium';
}

// ── Transport Mode Decision ──────────────────────────────────────────

function decideTransportMode(trip, distanceTier) {
    const pref = trip.travel_preference || 'any';
    const vehicle = trip.own_vehicle_type || 'none';

    // If user has their own vehicle and it's a road trip
    if (vehicle !== 'none' && trip.travel_style === 'road_trip') {
        return vehicle; // 'car' or 'bike'
    }

    // If user explicitly chose a mode
    if (pref !== 'any') return pref;

    // Auto-decide based on distance
    switch (distanceTier) {
        case 'local': return 'bus';
        case 'short': return 'train';
        case 'medium': return 'flight';
        case 'long': return 'flight';
        default: return 'train';
    }
}

// ── Cost Calculation ─────────────────────────────────────────────────

function calculateTransportCost(mode, distanceTier, travelers, currency) {
    const multiplier = CURRENCY_MULTIPLIERS[currency] || 1;
    let baseCost = 0;

    if (mode === 'car' || mode === 'bike') {
        // Estimate km based on tier
        const kmEstimates = { local: 20, short: 300, medium: 1000, long: 3000 };
        const km = kmEstimates[distanceTier] || 500;
        baseCost = km * TRANSPORT_COSTS[mode].perKm;
    } else {
        const costs = TRANSPORT_COSTS[mode] || TRANSPORT_COSTS.train;
        baseCost = costs[distanceTier] || costs.medium;
    }

    return Math.round(baseCost * travelers * multiplier);
}

function calculateAccommodationCost(preference, currency) {
    const multiplier = CURRENCY_MULTIPLIERS[currency] || 1;
    const tier = ACCOMMODATION_COSTS[preference] || ACCOMMODATION_COSTS['mid-range'];
    return Math.round(tier.perNight * multiplier);
}

function calculateLocalTransportCost(budgetTier, currency) {
    const multiplier = CURRENCY_MULTIPLIERS[currency] || 1;
    const tier = LOCAL_TRANSPORT_COSTS[budgetTier] || LOCAL_TRANSPORT_COSTS['mid-range'];
    return Math.round(tier.perDay * multiplier);
}

// ── Transport Mode Label & Icon Hint ─────────────────────────────────

const MODE_LABELS = {
    flight: '✈️ Flight',
    train: '🚄 Train',
    bus: '🚌 Bus',
    car: '🚗 Drive',
    bike: '🏍️ Ride',
};

// ── Main Engine ──────────────────────────────────────────────────────

/**
 * Generate transport, accommodation, and local transport segments
 * for a trip based on its constraints.
 * 
 * @param {object} trip - Trip object with constraints
 * @returns {object[]} Array of trip_segment rows ready for insert
 */
export function generateTransportSegments(trip) {
    if (!trip) return [];

    const segments = [];
    const currency = trip.currency || 'USD';
    const travelers = trip.travelers || 1;
    const accomPref = trip.accommodation_preference || 'mid-range';
    const budgetTier = accomPref; // Use accommodation preference as budget tier proxy
    const tripSegments = trip.segments || [];

    // Build day-to-location mapping
    const dayLocations = [];
    let dayCount = 0;
    tripSegments.forEach(seg => {
        for (let i = 0; i < (seg.days || 0); i++) {
            dayCount++;
            dayLocations.push({ dayNumber: dayCount, location: seg.location });
        }
    });

    const totalDays = dayLocations.length || (trip.days?.length || 0);
    if (totalDays === 0) return [];

    // ── 1. Outbound Travel (start_location → first destination) ──────
    const startLoc = trip.start_location;
    const firstDest = tripSegments[0]?.location || trip.destination;

    if (startLoc && firstDest && startLoc.toLowerCase() !== firstDest.toLowerCase()) {
        const distTier = estimateDistanceTier(startLoc, firstDest);
        const mode = decideTransportMode(trip, distTier);
        const cost = calculateTransportCost(mode, distTier, travelers, currency);

        segments.push({
            trip_id: trip.id,
            type: 'outbound_travel',
            title: `${MODE_LABELS[mode] || mode} — ${startLoc} → ${firstDest}`,
            day_number: 1,
            location: startLoc,
            estimated_cost: cost,
            order_index: -2, // Before all activities
            metadata: {
                transport_mode: mode,
                from: startLoc,
                to: firstDest,
                distance_tier: distTier,
                per_person: Math.round(cost / travelers),
            },
        });
    }

    // ── 2. Inter-city Travel (between consecutive destinations) ───────
    for (let i = 0; i < tripSegments.length - 1; i++) {
        const fromCity = tripSegments[i].location;
        const toCity = tripSegments[i + 1].location;

        if (fromCity && toCity && fromCity.toLowerCase() !== toCity.toLowerCase()) {
            // Calculate which day this transition happens
            let transitionDay = 0;
            for (let j = 0; j <= i; j++) {
                transitionDay += (tripSegments[j].days || 0);
            }

            const distTier = estimateDistanceTier(fromCity, toCity);
            const mode = decideTransportMode(trip, distTier);
            const cost = calculateTransportCost(mode, distTier, travelers, currency);

            segments.push({
                trip_id: trip.id,
                type: 'outbound_travel',
                title: `${MODE_LABELS[mode] || mode} — ${fromCity} → ${toCity}`,
                day_number: transitionDay,
                location: fromCity,
                estimated_cost: cost,
                order_index: 999, // After all activities on that day
                metadata: {
                    transport_mode: mode,
                    from: fromCity,
                    to: toCity,
                    distance_tier: distTier,
                    per_person: Math.round(cost / travelers),
                },
            });
        }
    }

    // ── 3. Return Travel (last destination → return_location) ─────────
    const returnLoc = trip.return_location || trip.start_location;
    const lastDest = tripSegments[tripSegments.length - 1]?.location || trip.destination;

    if (returnLoc && lastDest && returnLoc.toLowerCase() !== lastDest.toLowerCase()) {
        const distTier = estimateDistanceTier(lastDest, returnLoc);
        const mode = decideTransportMode(trip, distTier);
        const cost = calculateTransportCost(mode, distTier, travelers, currency);

        segments.push({
            trip_id: trip.id,
            type: 'return_travel',
            title: `${MODE_LABELS[mode] || mode} — ${lastDest} → ${returnLoc}`,
            day_number: totalDays,
            location: lastDest,
            estimated_cost: cost,
            order_index: 1000,
            metadata: {
                transport_mode: mode,
                from: lastDest,
                to: returnLoc,
                distance_tier: distTier,
                per_person: Math.round(cost / travelers),
            },
        });
    }

    // ── 4. Daily Local Transport ──────────────────────────────────────
    for (let d = 1; d <= totalDays; d++) {
        const dayLoc = dayLocations[d - 1]?.location || trip.destination;
        const localCost = calculateLocalTransportCost(budgetTier, currency);

        segments.push({
            trip_id: trip.id,
            type: 'local_transport',
            title: `🚕 Local transport in ${dayLoc}`,
            day_number: d,
            location: dayLoc,
            estimated_cost: localCost,
            order_index: -1, // Before activities
            metadata: {
                budget_tier: budgetTier,
                per_person: localCost,
            },
        });
    }

    // ── 5. Daily Accommodation ────────────────────────────────────────
    for (let d = 1; d < totalDays; d++) { // No accommodation on last night
        const dayLoc = dayLocations[d - 1]?.location || trip.destination;
        const nightCost = calculateAccommodationCost(accomPref, currency);

        segments.push({
            trip_id: trip.id,
            type: 'accommodation',
            title: `🏨 ${accomPref.charAt(0).toUpperCase() + accomPref.slice(1)} stay in ${dayLoc}`,
            day_number: d,
            location: dayLoc,
            estimated_cost: nightCost,
            order_index: 998, // Near end of day
            metadata: {
                accommodation_tier: accomPref,
                per_person: nightCost,
            },
        });
    }

    return segments;
}

/**
 * Get a readable label for a transport segment type
 */
export function getSegmentTypeLabel(type) {
    const labels = {
        outbound_travel: 'Travel',
        return_travel: 'Return',
        local_transport: 'Local Transport',
        accommodation: 'Accommodation',
        activity: 'Activity',
        food: 'Food & Dining',
    };
    return labels[type] || type;
}

/**
 * Check if a segment type is a logistics type (non-activity)
 */
export function isLogisticsSegment(type) {
    return ['outbound_travel', 'return_travel', 'local_transport', 'accommodation'].includes(type);
}
