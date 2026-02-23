/**
 * Trip Defaults — Derivation Layer
 *
 * Maps the simplified form inputs (travel_style + budget_tier)
 * into the internal fields the engine expects.
 *
 * Key principles:
 *   - Transport = 'auto' → engine decides based on distance/context
 *   - Budget scales with travelers (diminishing per-head)
 *   - Style multiplier adjusts cost realism
 *   - 12% buffer for unexpected expenses
 *   - International trips get 2.2× multiplier
 *
 * @module utils/tripDefaults
 */

// ── Configurable transport thresholds (km) ──────────────────────────
export const TRANSPORT_RULES = {
    FLIGHT_THRESHOLD: 800,     // > 800km → flight
    TRAIN_THRESHOLD: 300,      // 300–800km → train (or flight if high tier)
    LOCAL_THRESHOLD: 50,       // < 50km → local transport
};

// ── Style normalization: user-facing → internal engine values ─────────
// The engine uses these internally for ratio selection and transport logic
export const STYLE_NORMALIZATION_MAP = {
    relax: 'relaxation',
    explore: 'city_explorer',
    adventure: 'road_trip',       // adventure implies road trip in engine
    business: 'business',
};

// ── Legacy style → new user-facing style (backward compat for old DB trips)
export const LEGACY_STYLE_MAP = {
    road_trip: 'adventure',
    city_exploration: 'explore',
    luxury_escape: 'relax',
    backpacking: 'adventure',
    business_travel: 'business',
    // Passthrough for already-new styles
    relax: 'relax',
    explore: 'explore',
    adventure: 'adventure',
    business: 'business',
    // Internal styles → user-facing (for old trips stored with internal names)
    relaxation: 'relax',
    city_explorer: 'explore',
};

// ── Tier normalization: user-facing → internal engine values ──────────
export const TIER_NORMALIZATION_MAP = {
    low: 'budget',
    mid: 'mid-range',
    high: 'luxury',
    // Passthrough for already-normalized values
    budget: 'budget',
    'mid-range': 'mid-range',
    luxury: 'luxury',
};

// ── Activity count targets per style ─────────────────────────────────
export const PACE_BY_STYLE = {
    relax: 3,          // spa, beach — few activities, longer duration each
    explore: 5,        // sightseeing — balanced pace
    adventure: 4,      // outdoor activities — moderate but intense
    business: 2,       // meetings leave little time — efficient schedule
};

/**
 * Normalize a trip object's style and tier into engine-compatible values.
 * This is the SINGLE normalization point — call once at orchestrator entry.
 *
 * @param {object} trip — Raw trip from DB
 * @returns {{ normalizedStyle: string, normalizedTier: string, userStyle: string, userTier: string, hasOwnVehicle: boolean, pace: number }}
 */
export function normalizeTrip(trip) {
    const rawStyle = trip.travel_style || 'explore';
    // First map legacy → user-facing, then user-facing → engine internal
    const userStyle = LEGACY_STYLE_MAP[rawStyle] || rawStyle;
    const normalizedStyle = STYLE_NORMALIZATION_MAP[userStyle] || 'city_explorer';

    const rawTier = trip.budget_tier || trip.accommodation_preference || 'mid';
    const userTier = rawTier; // Already user-facing from form
    const normalizedTier = TIER_NORMALIZATION_MAP[rawTier] || 'mid-range';

    // Vehicle: adventure (road_trip internally) implies own vehicle behavior
    const hasOwnVehicle = normalizedStyle === 'road_trip';

    // Pace target
    const pace = PACE_BY_STYLE[userStyle] || 5;

    return { normalizedStyle, normalizedTier, userStyle, userTier, hasOwnVehicle, pace };
}

// ── Base daily budgets by tier and currency ──────────────────────────
const BASE_DAILY_BUDGET = {
    low:  { INR: 3000,  USD: 40,  EUR: 35,  GBP: 30,  JPY: 5000,  AUD: 55,  CAD: 50 },
    mid:  { INR: 10000, USD: 120, EUR: 110, GBP: 95,  JPY: 15000, AUD: 170, CAD: 155 },
    high: { INR: 35000, USD: 400, EUR: 370, GBP: 320, JPY: 50000, AUD: 550, CAD: 500 },
};

// ── Style multipliers ────────────────────────────────────────────────
const STYLE_MULTIPLIER = {
    relax: 1.1,         // spa, comfort adds ~10%
    explore: 1.0,       // balanced
    adventure: 0.85,    // outdoors/backpacking is cheaper
    business: 1.3,      // premium convenience + central locations
};

// ── Traveler scaling (diminishing per-head) ──────────────────────────
// 1 → 1x, 2 → 1.7x, 5 → 3.8x (not 5x — shared rooms, group rates)
const travelerMultiplier = (n) => n === 1 ? 1 : 1 + (n - 1) * 0.7;

// ── International multiplier ─────────────────────────────────────────
const INTERNATIONAL_MULTIPLIER = 2.2;

// ── Budget buffer (12% for unexpected expenses) ──────────────────────
const BUDGET_BUFFER = 1.12;

// ── Tier → accommodation mapping ─────────────────────────────────────
const TIER_TO_ACCOMMODATION = {
    low: 'budget',
    mid: 'mid-range',
    high: 'luxury',
};

/**
 * Detect if a trip is international (start country ≠ destination country).
 *
 * Uses a simple heuristic: checks if start_location and destination
 * strings share a country-level suffix. Not perfect, but good enough
 * without a geocoding API call.
 *
 * @param {object} trip
 * @returns {boolean}
 */
function isInternationalTrip(trip) {
    const start = (trip.start_location || '').toLowerCase().trim();
    const dest = (trip.destination || trip.segments?.[0]?.location || '').toLowerCase().trim();

    if (!start || !dest) return false;

    // Known country keywords for domestic detection
    const COUNTRY_KEYWORDS = {
        india: ['india', 'delhi', 'mumbai', 'bangalore', 'chennai', 'kolkata', 'hyderabad', 'goa', 'jaipur', 'pune', 'vizag', 'visakhapatnam'],
        usa: ['usa', 'united states', 'new york', 'los angeles', 'chicago', 'san francisco', 'miami', 'seattle'],
        uk: ['uk', 'united kingdom', 'london', 'manchester', 'birmingham', 'edinburgh'],
        japan: ['japan', 'tokyo', 'osaka', 'kyoto'],
        australia: ['australia', 'sydney', 'melbourne', 'brisbane'],
        france: ['france', 'paris', 'marseille', 'lyon'],
        germany: ['germany', 'berlin', 'munich', 'hamburg'],
        italy: ['italy', 'rome', 'milan', 'venice', 'florence'],
        spain: ['spain', 'madrid', 'barcelona', 'seville'],
        thailand: ['thailand', 'bangkok', 'phuket', 'chiang mai'],
        uae: ['uae', 'dubai', 'abu dhabi'],
    };

    // Find which country each belongs to
    let startCountry = null;
    let destCountry = null;

    for (const [country, keywords] of Object.entries(COUNTRY_KEYWORDS)) {
        if (keywords.some(kw => start.includes(kw))) startCountry = country;
        if (keywords.some(kw => dest.includes(kw))) destCountry = country;
    }

    // If we can identify both countries and they differ → international
    if (startCountry && destCountry && startCountry !== destCountry) return true;

    // If we can't identify one of them → be conservative, assume domestic
    return false;
}

/**
 * Resolve transport mode based on distance and budget tier.
 * Used when travel_preference is 'auto'.
 *
 * @param {number} distanceKm — Distance between cities
 * @param {string} budgetTier — 'low' | 'mid' | 'high'
 * @returns {string} — 'flight' | 'train' | 'bus' | 'local'
 */
export function resolveTransportMode(distanceKm, budgetTier = 'mid') {
    if (distanceKm > TRANSPORT_RULES.FLIGHT_THRESHOLD) return 'flight';
    if (distanceKm > TRANSPORT_RULES.TRAIN_THRESHOLD) {
        return budgetTier === 'low' ? 'train' : 'flight';
    }
    if (distanceKm > TRANSPORT_RULES.LOCAL_THRESHOLD) {
        return budgetTier === 'low' ? 'bus' : 'train';
    }
    return 'local';
}

/**
 * Main derivation function.
 *
 * Takes the simplified form fields (travel_style, budget_tier)
 * and derives all the internal fields the engine expects.
 *
 * @param {object} trip — Must contain: budget_tier, travel_style, currency, travelers, segments
 * @returns {{ budget, accommodation_preference, travel_preference, own_vehicle_type, budget_per_day }}
 */
export function deriveTripConstraints(trip) {
    const tier = trip.budget_tier || 'mid';
    const style = trip.travel_style || 'explore';
    const currency = trip.currency || 'INR';
    const travelers = trip.travelers || 1;
    const totalDays = (trip.segments || []).reduce((s, seg) => s + (seg.days || 0), 0) || 1;

    // Base daily rate for this tier + currency
    const baseDailyRate = BASE_DAILY_BUDGET[tier]?.[currency]
        || BASE_DAILY_BUDGET.mid.USD;

    // Scale by style, travelers, and international factor
    const intlFactor = isInternationalTrip(trip) ? INTERNATIONAL_MULTIPLIER : 1;

    const dailyBudget = Math.round(
        baseDailyRate
        * (STYLE_MULTIPLIER[style] || 1)
        * travelerMultiplier(travelers)
        * intlFactor
    );

    // Total budget with 12% buffer
    const totalBudget = Math.round(dailyBudget * totalDays * BUDGET_BUFFER);

    return {
        budget: totalBudget,
        budget_per_day: dailyBudget,
        accommodation_preference: TIER_TO_ACCOMMODATION[tier] || 'mid-range',
        travel_preference: 'auto',       // engine decides based on distance/context
        own_vehicle_type: 'auto',        // engine decides
    };
}

/**
 * Compatibility helper: get display tier for old trips that don't have budget_tier.
 *
 * @param {object} trip
 * @returns {'low' | 'mid' | 'high'}
 */
export function getDisplayTier(trip) {
    if (trip.budget_tier) return trip.budget_tier;
    // Infer from old accommodation_preference
    if (trip.accommodation_preference === 'budget') return 'low';
    if (trip.accommodation_preference === 'luxury') return 'high';
    return 'mid';
}

/**
 * Compatibility helper: get display style for old trips.
 *
 * @param {object} trip
 * @returns {string}
 */
export function getDisplayStyle(trip) {
    const style = trip.travel_style || '';
    return LEGACY_STYLE_MAP[style] || style || 'explore';
}
