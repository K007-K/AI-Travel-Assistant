/**
 * Transport Decision Engine
 * 
 * Deterministic, client-side utility that generates transport, accommodation,
 * and local commute trip_segments based on trip constraints.
 * 
 * NO AI calls — all costs come from lookup tables.
 *
 * City coordinates imported from shared data/cityCoordinates module.
 * Behavioral rules enforced:
 * - Rule 3: No flight when estimated driving time < 5 hours
 * - Rule 4: Own vehicle prioritized when available AND feasible (≤ 6h drive)
 * - Rule 9: Local transport inserted between activities > 2km apart (pairwise)
 */
import { getCityCoords } from '../data/cityCoordinates.js';

// ── Cost Lookup Tables (base costs in USD at US prices) ──────────────
// These reflect realistic US pricing. Other countries are adjusted
// via COST_OF_LIVING index (PPP-based purchasing power parity).

const TRANSPORT_COSTS = {
    flight: { short: 120, medium: 250, long: 450 },   // US domestic flights
    train: { short: 35, medium: 90, long: 180 },      // Amtrak-level pricing
    bus: { short: 18, medium: 45, long: 90 },          // Greyhound-level
    car: { perKm: 0.10 },   // fuel + wear per km (US gas prices)
    bike: { perKm: 0.04 },
};

const ACCOMMODATION_COSTS = {
    budget: { perNight: 40 },       // US hostel / motel
    'mid-range': { perNight: 120 }, // US 3-star hotel
    luxury: { perNight: 350 },      // US 5-star hotel
};

// ── Local transport cost per km (for pairwise insertion) ─────────────
// PPP-adjusted: these values produce realistic fares when multiplied
// by currency rates (e.g., ₹25 auto min, ₹50 cab min in India)

const LOCAL_FARE_PER_KM = {
    budget: 0.12,      // USD/km — auto-rickshaw, public bus (~₹10/km)
    'mid-range': 0.18, // USD/km — cab, metro (~₹15/km)
    luxury: 0.30,      // USD/km — premium cab (~₹25/km)
};

const LOCAL_MIN_FARE = {
    budget: 0.30,      // USD — auto minimum (~₹25)
    'mid-range': 0.60, // USD — cab/Ola minimum (~₹50)
    luxury: 1.20,      // USD — premium cab minimum (~₹100)
};

// ── Currency conversion rates and cost-of-living index ───────────────
// Data extracted to JSON files for maintainability.
// CURRENCY_MULTIPLIERS: approximate exchange rates relative to USD.
// COST_OF_LIVING: PPP-based purchasing power adjustment (1.0 = US baseline).
// REGION_DEFAULTS: fallback COL values by region (documentation reference).

import CURRENCY_MULTIPLIERS from '../data/currencyRates.json';
import costOfLivingData from '../data/costOfLiving.json';

const COST_OF_LIVING = costOfLivingData.COST_OF_LIVING;
const REGION_DEFAULTS = costOfLivingData.REGION_DEFAULTS;

/**
 * Get the effective cost multiplier for a currency.
 * = exchangeRate × costOfLiving (PPP adjustment).
 *
 * Smart fallback for unknown currencies:
 * 1. Check COST_OF_LIVING table (90+ currencies)
 * 2. If missing, infer from exchange rate:
 *    - Rate > 100 → likely a developing country (COL ~0.25)
 *    - Rate 10-100 → moderate economy (COL ~0.40)
 *    - Rate 1-10 → mid-range economy (COL ~0.65)
 *    - Rate < 1 → expensive country (COL ~1.10)
 *
 * Used for intercity travel and accommodation.
 * Local transport uses its own PPP-adjusted base rates.
 */
function getEffectiveMultiplier(currency) {
    const exchangeRate = CURRENCY_MULTIPLIERS[currency] || 1;

    // 1. Direct lookup (covers 90+ currencies)
    if (COST_OF_LIVING[currency] !== undefined) {
        return exchangeRate * COST_OF_LIVING[currency];
    }

    // 2. Smart fallback: infer COL from exchange rate magnitude
    //    High exchange rates (1 USD = 1000+ local) = cheap country
    //    Low exchange rates (1 USD < 2 local) = expensive country
    let inferredCOL;
    if (exchangeRate >= 1000) {
        inferredCOL = 0.20;  // Very cheap (Vietnam, Indonesia tier)
    } else if (exchangeRate >= 100) {
        inferredCOL = 0.25;  // Cheap (India, Pakistan tier)
    } else if (exchangeRate >= 10) {
        inferredCOL = 0.40;  // Moderate (Mexico, South Africa tier)
    } else if (exchangeRate >= 3) {
        inferredCOL = 0.55;  // Mid (Brazil, Malaysia tier)
    } else if (exchangeRate >= 1) {
        inferredCOL = 0.80;  // Developed (Canada, Australia tier)
    } else {
        inferredCOL = 1.10;  // Expensive (UK, Kuwait tier)
    }

    console.log(`[TransportEngine] Unknown currency "${currency}" — inferred COL=${inferredCOL} from rate=${exchangeRate}`);
    return exchangeRate * inferredCOL;
}

// ── Distance & Time Estimation ───────────────────────────────────────

/** Approximate km for each distance tier */
const KM_ESTIMATES = { local: 20, short: 300, medium: 1000, long: 3000 };

/**
 * Estimate driving time in hours for a given distance in km.
 * Uses 60 km/h average (realistic mixed road/highway).
 */
function estimateDrivingTime(distanceKm) {
    const avgSpeed = 60; // km/h
    return distanceKm / avgSpeed;
}

// ── Geocode lookup (lightweight, for distance estimation) ────────────

// GEOCODE_CITIES consolidated into data/cityCoordinates.js

/** Lookup geocode for a city name (partial match supported) */
function geocodeCityForDistance(location) {
    return getCityCoords(location);
}

/**
 * Fix Group 2: Robust distance tier estimation.
 *
 * Priority:
 * 1. sameRegionPairs override → 'short'
 * 2. Geocode both cities → haversine → tier from km
 * 3. Country keyword match → 'short'
 * 4. Default → 'short' (NOT 'medium' — prevents cost inflation)
 */
function estimateDistanceTier(from, to) {
    if (!from || !to) return 'short';

    const a = from.toLowerCase().trim();
    const b = to.toLowerCase().trim();

    if (a === b) return 'local';

    // 1. Override: known same-region pairs
    const sameRegionPairs = [
        ['delhi', 'mumbai'], ['delhi', 'jaipur'], ['delhi', 'agra'],
        ['delhi', 'shimla'], ['delhi', 'rishikesh'], ['delhi', 'manali'],
        ['delhi', 'lucknow'], ['delhi', 'amritsar'], ['delhi', 'varanasi'],
        ['mumbai', 'goa'], ['mumbai', 'pune'], ['mumbai', 'ahmedabad'],
        ['mumbai', 'surat'], ['mumbai', 'nashik'], ['mumbai', 'lonavala'],
        ['bangalore', 'chennai'], ['bangalore', 'mysore'], ['bangalore', 'coorg'],
        ['bangalore', 'ooty'], ['bangalore', 'pondicherry'], ['bangalore', 'goa'],
        ['bangalore', 'hampi'], ['bengaluru', 'mysuru'], ['bengaluru', 'coorg'],
        ['hyderabad', 'bangalore'], ['hyderabad', 'goa'], ['hyderabad', 'chennai'],
        ['hyderabad', 'vijayawada'], ['hyderabad', 'visakhapatnam'],
        ['visakhapatnam', 'tirupati'], ['visakhapatnam', 'vijayawada'],
        ['vijayawada', 'tirupati'], ['hyderabad', 'tirupati'],
        ['chennai', 'tirupati'], ['bangalore', 'tirupati'],
        ['visakhapatnam', 'araku'], ['visakhapatnam', 'srikakulam'],
        ['vijayawada', 'guntur'], ['vijayawada', 'hyderabad'],
        ['hyderabad', 'vijayawada'], ['hyderabad', 'visakhapatnam'],
        ['chennai', 'pondicherry'], ['chennai', 'kochi'], ['chennai', 'ooty'],
        ['kolkata', 'darjeeling'], ['kolkata', 'varanasi'],
        ['jaipur', 'udaipur'], ['jaipur', 'jodhpur'], ['jaipur', 'agra'],
        ['kochi', 'munnar'], ['kochi', 'alleppey'],
        ['shimla', 'manali'], ['leh', 'srinagar'],
        ['paris', 'lyon'], ['paris', 'nice'], ['paris', 'marseille'],
        ['london', 'manchester'], ['london', 'edinburgh'], ['london', 'birmingham'],
        ['new york', 'boston'], ['new york', 'philadelphia'], ['new york', 'washington'],
        ['los angeles', 'san francisco'], ['los angeles', 'las vegas'],
        ['tokyo', 'osaka'], ['tokyo', 'kyoto'],
        ['bangkok', 'chiang mai'], ['bangkok', 'phuket'], ['bangkok', 'pattaya'],
        ['sydney', 'melbourne'], ['sydney', 'canberra'],
        ['rome', 'florence'], ['rome', 'venice'], ['rome', 'naples'],
        ['berlin', 'munich'], ['berlin', 'hamburg'],
        ['barcelona', 'madrid'], ['barcelona', 'valencia'],
        ['istanbul', 'ankara'], ['istanbul', 'cappadocia'],
        ['dubai', 'abu dhabi'],
    ];

    const isShort = sameRegionPairs.some(([x, y]) =>
        (a.includes(x) && b.includes(y)) || (a.includes(y) && b.includes(x))
    );
    if (isShort) return 'short';

    // 2. Geocode-based haversine distance
    const coordsA = geocodeCityForDistance(from);
    const coordsB = geocodeCityForDistance(to);
    if (coordsA && coordsB) {
        const km = haversineDistance(coordsA.lat, coordsA.lng, coordsB.lat, coordsB.lng);
        if (km < 100) return 'local';
        if (km < 500) return 'short';
        if (km <= 1200) return 'medium';
        return 'long';
    }

    // 3. Country keyword match → 'short'
    const countryKeywords = [
        'india', 'usa', 'uk', 'japan', 'france', 'germany', 'italy', 'spain',
        'thailand', 'australia', 'brazil', 'mexico', 'canada', 'china',
    ];
    const aCountry = countryKeywords.find(c => a.includes(c));
    const bCountry = countryKeywords.find(c => b.includes(c));
    if (aCountry && bCountry && aCountry === bCountry) return 'short';

    // 4. Default → 'short' (Fix Group 2: prevents 1000km cost inflation)
    return 'short';
}

// ── Transport Mode Decision (Rule 3 + Rule 4 + Road Trip enforced) ───────

function decideTransportMode(trip, distanceTier) {
    const rawPref = trip.travel_preference || 'any';
    const pref = rawPref === 'auto' ? 'any' : rawPref;
    const rawVehicle = trip.own_vehicle_type || 'none';
    const vehicle = rawVehicle === 'auto' ? 'none' : rawVehicle;
    const distanceKm = KM_ESTIMATES[distanceTier] || 500;
    const drivingHours = estimateDrivingTime(distanceKm);
    const travelStyle = trip.travel_style || '';

    // ── Fix Group 6: Road trip override ──
    if (travelStyle === 'road_trip') {
        // NEVER allow flight in road trip mode
        // Force own vehicle when ≤ 800km
        if (vehicle !== 'none' && distanceKm <= 800) {
            return vehicle; // 'car' or 'bike'
        }
        // > 800km with own vehicle: still use own vehicle (road trip spirit)
        if (vehicle !== 'none') {
            return vehicle;
        }
        // No own vehicle in road trip mode: use bus/train, never flight
        return distanceKm <= 300 ? 'bus' : 'train';
    }

    // ── Rule 4: Own vehicle prioritized when available AND feasible (≤ 6h) ──
    if (vehicle !== 'none' && drivingHours <= 6) {
        return vehicle; // 'car' or 'bike'
    }

    // If user explicitly chose a mode (but still enforce Rule 3 for absurd cases)
    if (pref !== 'any') {
        // ── Rule 3: Only block explicit flight for truly short distances (< 2h / ~120km) ──
        // Previously blocked at < 5h, which was too aggressive and overrode user intent
        if (pref === 'flight' && drivingHours < 2) {
            return 'train'; // Downgrade only for absurdly short flight requests
        }
        return pref;
    }

    // Auto-decide based on distance + time
    // Budget tier: prefer bus over train for cost savings
    const isBudget = ['budget', 'low'].includes((trip.budget_tier || '').toLowerCase());

    // ── Rule 3: Flight only when driving time ≥ 8 hours (~480km+) ──
    // Budget travelers get train instead of flight for 8-12h routes
    if (drivingHours >= 8) {
        return isBudget ? 'train' : 'flight';
    }

    // Sub-8h routes: budget → bus, mid/luxury → train
    switch (distanceTier) {
        case 'local': return 'bus';
        case 'short': return isBudget ? 'bus' : 'train';
        case 'medium': return isBudget ? 'bus' : 'train';
        default: return isBudget ? 'bus' : 'train';
    }
}

// ── Cost Calculation ─────────────────────────────────────────────────

function calculateTransportCost(mode, distanceTier, travelers, currency) {
    const multiplier = getEffectiveMultiplier(currency);
    let baseCost = 0;

    if (mode === 'car' || mode === 'bike') {
        const km = KM_ESTIMATES[distanceTier] || 500;
        baseCost = km * TRANSPORT_COSTS[mode].perKm;
    } else {
        const costs = TRANSPORT_COSTS[mode] || TRANSPORT_COSTS.train;
        baseCost = costs[distanceTier] || costs.medium;
    }

    return Math.round(baseCost * travelers * multiplier);
}

// ── Fix Group 1: Envelope-Aware Transport ────────────────────────────

const DOWNGRADE_LADDER = ['flight', 'train', 'bus', 'car'];

/**
 * Calculate transport cost with budget envelope awareness.
 * If preferred mode exceeds remaining envelope, walk down the
 * downgrade ladder until cost fits or clamp to remaining.
 *
 * IMPORTANT: When user explicitly chose a transport preference
 * (e.g. 'flight'), we RESPECT it and don't silently downgrade.
 * The downgrade ladder only applies when preference was 'any'.
 *
 * @param {string} preferredMode — Mode from decideTransportMode()
 * @param {string} distanceTier
 * @param {number} travelers
 * @param {string} currency
 * @param {number} remaining — allocation.intercity_remaining
 * @param {boolean} [userExplicitChoice=false] — True when user picked this mode
 * @returns {{ mode: string, cost: number, adjusted: boolean }}
 */
function envelopeAwareTransportCost(preferredMode, distanceTier, travelers, currency, remaining, userExplicitChoice = false) {
    // If no budget left at all, return zero-cost
    if (remaining <= 0) {
        return { mode: preferredMode, cost: 0, adjusted: true };
    }

    let cost = calculateTransportCost(preferredMode, distanceTier, travelers, currency);

    // If within envelope, use as-is
    if (cost <= remaining) {
        return { mode: preferredMode, cost, adjusted: false };
    }

    // ── FIX: When user EXPLICITLY chose a mode, respect it ──
    // Don't silently downgrade from flight to bus/train.
    // Let the cost stand (may overshoot envelope) and flag it.
    if (userExplicitChoice) {
        console.warn(`[TransportEngine] User chose ${preferredMode} (₹${cost}) but exceeds envelope (₹${remaining}). Respecting preference.`);
        return { mode: preferredMode, cost, adjusted: false };
    }

    // Walk the downgrade ladder starting from the step AFTER current mode
    const startIdx = DOWNGRADE_LADDER.indexOf(preferredMode);
    let bestMode = preferredMode;
    let bestCost = cost;

    for (let i = Math.max(0, startIdx + 1); i < DOWNGRADE_LADDER.length; i++) {
        const trialMode = DOWNGRADE_LADDER[i];
        const trialCost = calculateTransportCost(trialMode, distanceTier, travelers, currency);
        if (trialCost <= remaining) {
            return { mode: trialMode, cost: trialCost, adjusted: true };
        }
        // Track cheapest even if it still exceeds
        if (trialCost < bestCost) {
            bestMode = trialMode;
            bestCost = trialCost;
        }
    }

    // Cheapest mode still exceeds — clamp to remaining
    return { mode: bestMode, cost: remaining, adjusted: true };
}

function calculateAccommodationCost(preference, currency) {
    const multiplier = getEffectiveMultiplier(currency);
    const tier = ACCOMMODATION_COSTS[preference] || ACCOMMODATION_COSTS['mid-range'];
    return Math.round(tier.perNight * multiplier);
}

/**
 * Calculate pairwise local transport cost for a given distance in km.
 * Rule 9: Realistic per-trip fare based on distance.
 */
function calculateLocalTripCost(distanceKm, budgetTier, currency) {
    const multiplier = CURRENCY_MULTIPLIERS[currency] || 1;
    const farePerKm = LOCAL_FARE_PER_KM[budgetTier] || LOCAL_FARE_PER_KM['mid-range'];
    const minFare = LOCAL_MIN_FARE[budgetTier] || LOCAL_MIN_FARE['mid-range'];
    const cost = Math.max(minFare, distanceKm * farePerKm);
    return Math.round(cost * multiplier);
}

// ── Haversine Distance (for Rule 9) ──────────────────────────────────

/**
 * Haversine distance between two lat/lng points in km.
 * Used for pairwise local transport insertion.
 */
export function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Transport Mode Label & Icon Hint ─────────────────────────────────

const MODE_LABELS = {
    flight: '✈️ Flight',
    train: '🚄 Train',
    bus: '🚌 Bus',
    car: '🚗 Drive',
    bike: '🏍️ Ride',
};

// Export CURRENCY_MULTIPLIERS for orchestrator / booking engine
export { CURRENCY_MULTIPLIERS };

// ── Isolated Phase Functions (used by tripOrchestrator) ──────────────

/**
 * Phase 2: Build outbound travel segment (start_location → first destination).
 * Deducts cost from allocation.intercity_remaining.
 *
 * @param {object} trip        — Trip object
 * @param {object} allocation  — Budget allocation from budgetAllocator
 * @param {number} currencyRate — Currency multiplier (unused here, cost uses trip.currency)
 * @returns {object|null} — Segment row or null if no outbound needed
 */
export function buildOutboundSegment(trip, allocation, _currencyRate) {
    const tripSegments = trip.segments || [];
    const startLoc = trip.start_location;
    const firstDest = tripSegments[0]?.location || trip.destination;
    const travelers = trip.travelers || 1;
    const currency = trip.currency || 'USD';

    if (!startLoc || !firstDest || startLoc.toLowerCase() === firstDest.toLowerCase()) {
        return null;
    }

    // Fix Group 4: Skip if no intercity budget remaining
    const remaining = allocation?.intercity_remaining ?? Infinity;
    if (remaining <= 0) return null;

    let distTier = estimateDistanceTier(startLoc, firstDest);

    // Override distance tier with real OSRM distance if available.
    // The synchronous estimateDistanceTier can't geocode unknown cities,
    // so it defaults to 'short' (300km). Real OSRM data fixes this.
    if (trip._osrm_outbound_km && trip._osrm_outbound_km > 0) {
        const realKm = trip._osrm_outbound_km;
        if (realKm < 100) distTier = 'local';
        else if (realKm < 500) distTier = 'short';
        else if (realKm <= 1200) distTier = 'medium';
        else distTier = 'long';
    }

    const preferredMode = decideTransportMode(trip, distTier);

    // Fix Group 1: Envelope-aware cost with downgrade ladder
    const userExplicit = !['any', 'auto'].includes(trip.travel_preference || 'any');
    const { mode, cost, adjusted } = envelopeAwareTransportCost(
        preferredMode, distTier, travelers, currency, remaining, userExplicit
    );

    // Deduct from intercity envelope
    if (allocation) {
        allocation.intercity_remaining = Math.max(0, (allocation.intercity_remaining || 0) - cost);
    }

    // Overnight detection: 6-16h bus/train for budget/mid tier
    // Use real OSRM hours if available (injected by orchestrator), otherwise fallback
    const distanceKm = KM_ESTIMATES[distTier] || 500;
    const travelHours = trip._osrm_outbound_hours || estimateDrivingTime(distanceKm);
    const budgetTierNorm = (trip.budget_tier || trip.accommodation_preference || 'mid');
    const isOvernightEligible = travelHours >= 6 && travelHours <= 16
        && ['bus', 'train'].includes(mode)
        && budgetTierNorm !== 'luxury' && budgetTierNorm !== 'high';

    return {
        trip_id: trip.id,
        type: 'outbound_travel',
        title: `${isOvernightEligible ? '🌙 Overnight ' : ''}${MODE_LABELS[mode] || mode} — ${startLoc} → ${firstDest}`,
        day_number: 1,
        location: startLoc,
        estimated_cost: cost,
        order_index: -2,
        metadata: {
            transport_mode: mode,
            from: startLoc,
            to: firstDest,
            distance_tier: distTier,
            per_person: Math.round(cost / travelers),
            adjusted_for_budget: adjusted || undefined,
            isOvernight: isOvernightEligible,
            estimatedHours: travelHours,
            departure: isOvernightEligible ? '21:00' : undefined,
            arrival: isOvernightEligible ? '07:00' : undefined,
        },
    };
}

/**
 * Phase 2b: Build inter-city travel segments for multi-city trips.
 *
 * @param {object} trip        — Trip object
 * @param {object} allocation  — Budget allocation
 * @param {number} currencyRate
 * @returns {object[]} — Array of intercity segments
 */
export function buildIntercitySegments(trip, allocation, _currencyRate) {
    const tripSegments = trip.segments || [];
    const travelers = trip.travelers || 1;
    const currency = trip.currency || 'USD';
    const segments = [];

    for (let i = 0; i < tripSegments.length - 1; i++) {
        const fromCity = tripSegments[i].location;
        const toCity = tripSegments[i + 1].location;

        if (fromCity && toCity && fromCity.toLowerCase() !== toCity.toLowerCase()) {
            let transitionDay = 0;
            for (let j = 0; j <= i; j++) {
                transitionDay += (tripSegments[j].days || 0);
            }

            // Fix Group 4: Skip if no intercity budget remaining
            const remaining = allocation?.intercity_remaining ?? Infinity;
            if (remaining <= 0) continue;

            const distTier = estimateDistanceTier(fromCity, toCity);
            const preferredMode = decideTransportMode(trip, distTier);

            // Fix Group 1: Envelope-aware cost with downgrade ladder
            const userExplicit = !['any', 'auto'].includes(trip.travel_preference || 'any');
            const { mode, cost, adjusted } = envelopeAwareTransportCost(
                preferredMode, distTier, travelers, currency, remaining, userExplicit
            );

            if (allocation) {
                allocation.intercity_remaining = Math.max(0, (allocation.intercity_remaining || 0) - cost);
            }

            segments.push({
                trip_id: trip.id,
                type: 'intercity_travel',
                title: `${MODE_LABELS[mode] || mode} — ${fromCity} → ${toCity}`,
                day_number: transitionDay,
                location: fromCity,
                estimated_cost: cost,
                order_index: 999,
                metadata: {
                    transport_mode: mode,
                    from: fromCity,
                    to: toCity,
                    distance_tier: distTier,
                    per_person: Math.round(cost / travelers),
                    adjusted_for_budget: adjusted || undefined,
                },
            });
        }
    }

    return segments;
}

/**
 * Phase 6: Build return travel segment (last destination → return_location).
 *
 * @param {object} trip
 * @param {object} allocation
 * @param {number} currencyRate
 * @param {number} totalDays — Which day to place return on
 * @returns {object|null}
 */
export function buildReturnSegment(trip, allocation, currencyRate, totalDays) {
    const tripSegments = trip.segments || [];
    const returnLoc = trip.return_location || trip.start_location;
    const lastDest = tripSegments[tripSegments.length - 1]?.location || trip.destination;
    const travelers = trip.travelers || 1;
    const currency = trip.currency || 'USD';

    // Compute totalDays if not provided
    if (!totalDays) {
        totalDays = tripSegments.reduce((sum, s) => sum + (s.days || 0), 0);
    }

    if (!returnLoc || !lastDest || returnLoc.toLowerCase() === lastDest.toLowerCase()) {
        return null;
    }

    let distTier = estimateDistanceTier(lastDest, returnLoc);

    // Override distance tier with real OSRM distance if available
    if (trip._osrm_return_km && trip._osrm_return_km > 0) {
        const realKm = trip._osrm_return_km;
        if (realKm < 100) distTier = 'local';
        else if (realKm < 500) distTier = 'short';
        else if (realKm <= 1200) distTier = 'medium';
        else distTier = 'long';
    }

    const preferredMode = decideTransportMode(trip, distTier);

    // Return trip uses the ACTUAL cost (same as outbound direction)
    // NOT clamped to remaining envelope — round trips should cost the same both ways
    const cost = calculateTransportCost(preferredMode, distTier, travelers, currency);

    if (allocation) {
        allocation.intercity_remaining = Math.max(0, (allocation.intercity_remaining || 0) - cost);
    }

    // Overnight detection (same as outbound)
    // Use real OSRM hours if available, otherwise fallback
    const distanceKm = KM_ESTIMATES[distTier] || 500;
    const travelHours = trip._osrm_return_hours || estimateDrivingTime(distanceKm);
    const budgetTierNorm = (trip.budget_tier || trip.accommodation_preference || 'mid');
    const isOvernightEligible = travelHours >= 6 && travelHours <= 16
        && ['bus', 'train'].includes(preferredMode)
        && budgetTierNorm !== 'luxury' && budgetTierNorm !== 'high';

    return {
        trip_id: trip.id,
        type: 'return_travel',
        title: `${isOvernightEligible ? '🌙 Overnight ' : ''}${MODE_LABELS[preferredMode] || preferredMode} — ${lastDest} → ${returnLoc}`,
        day_number: totalDays,
        location: lastDest,
        estimated_cost: cost,
        order_index: 1000,
        metadata: {
            transport_mode: preferredMode,
            from: lastDest,
            to: returnLoc,
            distance_tier: distTier,
            per_person: Math.round(cost / travelers),
            isOvernight: isOvernightEligible,
            estimatedHours: travelHours,
            departure: isOvernightEligible ? '21:00' : undefined,
            arrival: isOvernightEligible ? '07:00' : undefined,
        },
    };
}

/**
 * Phase 3: Build nightly accommodation segments.
 * Cost per night = allocation.accommodation_per_night (from budget allocator).
 * Falls back to lookup-table cost if no allocation provided.
 *
 * @param {object} trip
 * @param {object} allocation
 * @param {number} currencyRate
 * @param {object[]} dayLocations — Array of { dayNumber, location }
 * @returns {object[]}
 */
export function buildAccommodationSegments(trip, allocation, currencyRate, dayLocations) {
    const accomPref = trip.accommodation_preference || 'mid-range';
    const travelStyle = trip.travel_style || '';
    const currency = trip.currency || 'USD';
    const totalDays = dayLocations?.length || 0;
    const segments = [];

    // Accommodation quality label
    let qualityLabel = accomPref.charAt(0).toUpperCase() + accomPref.slice(1);
    if (travelStyle === 'road_trip') {
        qualityLabel = 'Flexible lodging';
    }

    for (let d = 1; d < totalDays; d++) { // No accommodation on last night
        const dayLoc = dayLocations[d - 1]?.location || trip.destination;

        // Use allocation-based pricing if available, else lookup table
        const nightCost = allocation?.accommodation_per_night
            ? allocation.accommodation_per_night
            : calculateAccommodationCost(accomPref, currency);

        // Guard: skip if accommodation envelope is exhausted
        const accomRemaining = allocation?.accommodation_remaining ?? Infinity;
        if (accomRemaining <= 0) continue;

        // Fix Group 2: Deduct from accommodation envelope
        if (allocation?.accommodation_remaining !== undefined) {
            allocation.accommodation_remaining = Math.max(0, allocation.accommodation_remaining - nightCost);
        }

        segments.push({
            trip_id: trip.id,
            type: 'accommodation',
            title: `🏨 ${qualityLabel} stay in ${dayLoc}`,
            day_number: d,
            location: dayLoc,
            estimated_cost: nightCost,
            order_index: 998,
            metadata: {
                accommodation_tier: accomPref,
                per_person: nightCost,
                quality_label: qualityLabel,
            },
        });
    }

    return segments;
}

// ── Legacy Wrapper (deprecated — use orchestrator) ───────────────────

/**
 * @deprecated Use tripOrchestrator.orchestrateTrip() instead.
 * Kept for backward compatibility during migration.
 */
export function generateTransportSegments(trip) {
    if (!trip) return [];

    const currency = trip.currency || 'USD';
    const currencyRate = CURRENCY_MULTIPLIERS[currency] || 1;
    const tripSegments = trip.segments || [];

    const dayLocations = [];
    let dayCount = 0;
    tripSegments.forEach(seg => {
        for (let i = 0; i < (seg.days || 0); i++) {
            dayCount++;
            dayLocations.push({ dayNumber: dayCount, location: seg.location });
        }
    });

    if (dayLocations.length === 0 && trip.days) {
        trip.days.forEach((d, i) => {
            dayLocations.push({ dayNumber: i + 1, location: d.location || trip.destination });
        });
    }

    const totalDays = dayLocations.length;
    if (totalDays === 0) return [];

    const segments = [];

    const outbound = buildOutboundSegment(trip, null, currencyRate);
    if (outbound) segments.push(outbound);

    segments.push(...buildIntercitySegments(trip, null, currencyRate));

    const ret = buildReturnSegment(trip, null, currencyRate, totalDays);
    if (ret) segments.push(ret);

    segments.push(...buildAccommodationSegments(trip, null, currencyRate, dayLocations));

    return segments;
}

/**
 * Rule 9: Insert pairwise local transport segments between activities > 2km apart.
 * Called after AI generates activities and geocodes them.
 *
 * @param {object[]} activities - Array of activity objects with lat/lng
 * @param {string} tripId - Trip UUID
 * @param {number} dayNumber - Day number
 * @param {string} budgetTier - 'budget' | 'mid-range' | 'luxury'
 * @param {string} currency - Currency code
 * @param {object} [allocation] - Budget allocation for envelope deduction
 * @returns {object[]} Array of local_transport segments to insert between activities
 */
export function insertPairwiseLocalTransport(activities, tripId, dayNumber, budgetTier, currency, allocation) {
    const localSegments = [];
    const FALLBACK_DISTANCE_KM = 5; // Used when one activity lacks coordinates
    const MAX_LOCAL_DISTANCE_KM = 50; // Same-day activities can't be >50km apart

    for (let i = 0; i < activities.length - 1; i++) {
        const a = activities[i];
        const b = activities[i + 1];

        const aHasCoords = a.latitude && a.longitude;
        const bHasCoords = b.latitude && b.longitude;
        const aFailed = a.metadata?.geocode_failed;
        const bFailed = b.metadata?.geocode_failed;

        // Skip when BOTH activities have geocode_failed
        if (aFailed && bFailed) continue;

        let distKm;
        if (aHasCoords && bHasCoords) {
            distKm = haversineDistance(
                parseFloat(a.latitude), parseFloat(a.longitude),
                parseFloat(b.latitude), parseFloat(b.longitude)
            );
            // Cap: same-day activities realistically can't be >50km apart
            if (distKm > MAX_LOCAL_DISTANCE_KM) {
                distKm = FALLBACK_DISTANCE_KM;
            }
        } else {
            // One has coordinates, one doesn't — use fallback distance
            distKm = FALLBACK_DISTANCE_KM;
        }

        if (distKm > 0.2) {
            // Guard: skip if local transport envelope is exhausted
            const localRemaining = allocation?.local_transport_remaining ?? Infinity;
            if (localRemaining <= 0) continue;

            const cost = calculateLocalTripCost(distKm, budgetTier, currency);

            // Fix Group 2: Deduct from local_transport envelope
            if (allocation?.local_transport_remaining !== undefined) {
                allocation.local_transport_remaining = Math.max(0, allocation.local_transport_remaining - cost);
            }

            localSegments.push({
                trip_id: tripId,
                type: 'local_transport',
                title: `🚕 ${a.location || a.title} → ${b.location || b.title} (${distKm.toFixed(1)} km)`,
                day_number: dayNumber,
                location: a.location || '',
                estimated_cost: cost,
                order_index: a.order_index + 0.5,
                metadata: {
                    from: a.location || a.title,
                    to: b.location || b.title,
                    distance_km: Math.round(distKm * 10) / 10,
                    budget_tier: budgetTier,
                    per_person: cost,
                },
            });
        }
    }

    return localSegments;
}

/**
 * Get a readable label for a transport segment type
 */
export function getSegmentTypeLabel(type) {
    const labels = {
        outbound_travel: 'Travel',
        intercity_travel: 'Intercity',
        return_travel: 'Return',
        local_transport: 'Local Transport',
        accommodation: 'Accommodation',
        activity: 'Activity',
        gem: 'Hidden Gem',
        food: 'Food & Dining',
    };
    return labels[type] || type;
}

/**
 * Check if a segment type is a logistics type (non-activity)
 */
export function isLogisticsSegment(type) {
    return ['outbound_travel', 'return_travel', 'intercity_travel', 'local_transport', 'accommodation'].includes(type);
}

// ── TEST EXPORTS (used by constraint compliance test harness) ────────
export {
    decideTransportMode as _decideTransportMode,
    estimateDistanceTier as _estimateDistanceTier,
    calculateTransportCost as _calculateTransportCost,
    calculateAccommodationCost as _calculateAccommodationCost,
    KM_ESTIMATES as _KM_ESTIMATES,
    estimateDrivingTime as _estimateDrivingTime,
};
