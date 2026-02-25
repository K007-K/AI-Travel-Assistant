/**
 * Trip Orchestrator — Full Lifecycle Travel Generation Engine
 *
 * Single entry point: `orchestrateTrip(trip)`
 *
 * Executes phases in strict order:
 *   1.   Budget Allocation (algorithmic)
 *   2.   Outbound Travel
 *   3.   Accommodation
 *   4.   Activity Generation (AI)
 *   4a.  AI Sanitizer (strip rogue transport/accommodation)
 *   4b.  Activity Budget Enforcement (proportional scaling)
 *   4c.  Geocoding (enrich activities with coordinates)
 *   4d.  Feasibility Guard (deterministic constraint enforcement)
 *   5.   Local Transport (pairwise, uses geocoded coordinates)
 *   6.   Return Travel
 *   7.   (moved to post-insert in store — booking suggestions need DB IDs)
 *   8.   Daily Cost Summary
 *   9.   Hidden Gems (AI)
 *  10.   Budget Reconciliation
 *
 * Returns the structured contract output:
 * {
 *   allocation, segments, daily_summary,
 *   hidden_gems, reconciliation
 * }
 *
 * Note: booking_options are generated post-DB-insert in itineraryStore
 * to ensure they reference real segment UUIDs (Fix Group 4).
 *
 * @module engine/tripOrchestrator
 */

import { allocateBudget, deductFromEnvelope, reconcileBudget } from './budgetAllocator.js';
import { applyFeasibilityGuard } from './feasibilityGuard.js';
import {
    buildOutboundSegment,
    buildReturnSegment,
    buildIntercitySegments,
    buildAccommodationSegments,
    insertPairwiseLocalTransport,
    CURRENCY_MULTIPLIERS,
} from '../utils/transportEngine.js';
import { generateTripPlan, getHiddenGems } from '../api/groq.js';
import { getCityCoordsLong, CITY_COORDINATES } from '../data/cityCoordinates.js';
import { normalizeTrip } from '../utils/tripDefaults.js';

// ── Geocoder (Phase 4c) — Nominatim API + local cache ────────────────

// In-memory cache for the current session
const _geocodeMemCache = {};

// localStorage cache helpers (30-day TTL)
// v2: invalidates stale city-center coords from pre-Nominatim-first fix
const GEO_CACHE_KEY = 'geocode_cache_v2';
function _getGeoCache() {
    try {
        const raw = localStorage.getItem(GEO_CACHE_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        // Purge entries older than 30 days
        const now = Date.now();
        const TTL = 30 * 24 * 60 * 60 * 1000;
        for (const key of Object.keys(parsed)) {
            if (now - (parsed[key]?.ts || 0) > TTL) delete parsed[key];
        }
        return parsed;
    } catch { return {}; }
}
function _setGeoCache(key, coords) {
    try {
        const cache = _getGeoCache();
        cache[key] = { ...coords, ts: Date.now() };
        localStorage.setItem(GEO_CACHE_KEY, JSON.stringify(cache));
    } catch { /* quota exceeded — ignore */ }
}

// KNOWN_CITIES consolidated into data/cityCoordinates.js

/**
 * Fetch coordinates from OpenStreetMap Nominatim API.
 * Free, no API key, works for any place worldwide.
 * Rate-limited to ~1 req/sec by Nominatim policy.
 */
async function _fetchFromNominatim(query) {
    try {
        const params = new URLSearchParams({
            q: query,
            format: 'json',
            limit: '1',
            addressdetails: '0',
        });
        const res = await fetch(
            `https://nominatim.openstreetmap.org/search?${params}`,
            { headers: { 'User-Agent': 'AITravelAssistant/1.0' } }
        );
        if (!res.ok) return null;
        const data = await res.json();
        if (data.length > 0) {
            return {
                latitude: parseFloat(data[0].lat),
                longitude: parseFloat(data[0].lon),
            };
        }
        return null;
    } catch {
        return null;
    }
}

/**
 * Geocode a location string. Strategy:
 *   1. In-memory cache (instant)
 *   2. localStorage cache (instant, persists across sessions)
 *   3. KNOWN_CITIES **exact** match only (instant, no network)
 *   4. Nominatim API (any place worldwide, cached after first call)
 *   5. Nominatim with cityContext appended (e.g., "Rishikonda Beach, Vizag")
 *   6. City-level partial match fallback (last resort — city-center coords)
 *
 * IMPORTANT: Partial city matching is deliberately LAST because locations
 * like "Borra Caves, Visakhapatnam" contain the city name but are 100km
 * from city center. We must try Nominatim first for accurate coords.
 *
 * @param {string} location — Place name (e.g., "Rishikonda Beach")
 * @param {string} activityHint — Used for deterministic ±1km offset
 * @param {string} cityContext — Parent city for the day (e.g., "Visakhapatnam")
 * @returns {Promise<{ latitude: number, longitude: number } | null>}
 */
async function geocodeLocation(location, activityHint = '', cityContext = '') {
    if (!location || typeof location !== 'string') return null;

    const normalized = location.toLowerCase().trim();
    const cacheKey = normalized;

    // 1. In-memory cache
    if (_geocodeMemCache[cacheKey]) {
        return _applyOffset(_geocodeMemCache[cacheKey], activityHint || normalized);
    }

    // 2. localStorage cache
    const diskCache = _getGeoCache();
    if (diskCache[cacheKey]?.latitude) {
        const coords = { latitude: diskCache[cacheKey].latitude, longitude: diskCache[cacheKey].longitude };
        _geocodeMemCache[cacheKey] = coords;
        return _applyOffset(coords, activityHint || normalized);
    }

    // 3. EXACT city match only — don't use partial matches here
    //    (partial matching would give "Borra Caves, Visakhapatnam" the same
    //    coords as "Visakhapatnam" city center, which is 100km wrong)
    const exactMatch = getCityCoordsLong(normalized);
    if (exactMatch) {
        _geocodeMemCache[cacheKey] = exactMatch;
        _setGeoCache(cacheKey, exactMatch);
        return _applyOffset(exactMatch, activityHint || normalized);
    }

    // 4. Nominatim API — works for any specific place in the world
    const nominatimResult = await _fetchFromNominatim(location);
    if (nominatimResult) {
        _geocodeMemCache[cacheKey] = nominatimResult;
        _setGeoCache(cacheKey, nominatimResult);
        return _applyOffset(nominatimResult, activityHint || normalized);
    }

    // 5. Try with city context (e.g., "Rishikonda Beach, Visakhapatnam")
    if (cityContext) {
        const withCity = await _fetchFromNominatim(`${location}, ${cityContext}`);
        if (withCity) {
            _geocodeMemCache[cacheKey] = withCity;
            _setGeoCache(cacheKey, withCity);
            return _applyOffset(withCity, activityHint || normalized);
        }
    }

    // 6. LAST RESORT: partial city match from CITY_COORDINATES
    //    Only reaches here if Nominatim failed entirely
    for (const [city] of Object.entries(CITY_COORDINATES)) {
        if (normalized.includes(city) || city.includes(normalized)) {
            const partialCoords = getCityCoordsLong(city);
            if (partialCoords) {
                console.warn(`[Geocoder] Using city-level fallback for "${location}" → matched "${city}" (Nominatim failed)`);
                _geocodeMemCache[cacheKey] = partialCoords;
                _setGeoCache(cacheKey, partialCoords);
                return _applyOffset(partialCoords, activityHint || normalized);
            }
        }
    }

    // 7. Final fallback: use cityContext city coords
    if (cityContext) {
        const cityKey = cityContext.toLowerCase().trim();
        if (!_geocodeMemCache[cityKey]) {
            const cityCoords = getCityCoordsLong(cityKey)
                || await _fetchFromNominatim(cityContext);
            if (cityCoords) {
                _geocodeMemCache[cityKey] = cityCoords;
                _setGeoCache(cityKey, cityCoords);
            }
        }
        if (_geocodeMemCache[cityKey]) {
            console.warn(`[Geocoder] Using parent city fallback for "${location}" → "${cityContext}"`);
            _geocodeMemCache[cacheKey] = _geocodeMemCache[cityKey];
            return _applyOffset(_geocodeMemCache[cityKey], activityHint || normalized);
        }
    }

    return null;
}

/**
 * Apply deterministic ±0.01° (~1km) offset to base coords.
 * Ensures activities at the same city don't stack at identical points.
 */
function _applyOffset(baseCoords, hintStr) {
    let hintHash = 0;
    for (let i = 0; i < hintStr.length; i++) {
        hintHash = ((hintHash << 5) - hintHash + hintStr.charCodeAt(i)) | 0;
    }
    const latOffset = ((hintHash % 20) - 10) / 1000; // ±0.010°
    const lngOffset = (((hintHash >> 8) % 20) - 10) / 1000;
    return {
        latitude: Math.round((baseCoords.latitude + latOffset) * 10000) / 10000,
        longitude: Math.round((baseCoords.longitude + lngOffset) * 10000) / 10000,
    };
}

/**
 * Phase 4c: Enrich AI activities with geocoded coordinates.
 * Now async to support Nominatim API lookups for unknown locations.
 *
 * @param {object[]} activitySegments — Activity segments from AI conversion
 * @param {object[]} dayLocations — Array of { dayNumber, location }
 * @returns {Promise<object[]>} — Same array, mutated with latitude/longitude
 */
async function enrichActivitiesWithCoordinates(activitySegments, dayLocations = []) {
    for (const seg of activitySegments) {
        const hint = (seg.title || '') + '|' + (seg.metadata?.time_of_day || '') + '|' + (seg.order_index || 0);
        const dayLoc = dayLocations.find(dl => dl.dayNumber === seg.day_number);
        const cityContext = dayLoc?.location || '';
        const coords = await geocodeLocation(seg.location, hint, cityContext);
        if (coords) {
            seg.latitude = coords.latitude;
            seg.longitude = coords.longitude;
            seg.metadata = { ...seg.metadata, latitude: coords.latitude, longitude: coords.longitude };
        } else {
            seg.metadata = { ...seg.metadata, geocode_failed: true };
        }
    }
    return activitySegments;
}

// ── AI Sanitizer (Fix Group 3) ───────────────────────────────────────

const TRANSPORT_KEYWORDS = /\b(flight|train|bus|taxi|uber|cab|metro|subway|shuttle|transfer|airport|station)\b/i;
const ACCOMMODATION_KEYWORDS = /\b(hotel|hostel|resort|stay|check.?in|check.?out|airbnb|lodge|motel|guesthouse)\b/i;

/**
 * Phase 4a: Strip rogue transport/accommodation items from AI response.
 *
 * @param {object[]} days — AI response days array
 * @returns {object[]} — Sanitized days array (mutates in place)
 */
function sanitizeAIActivities(days) {
    const removed = [];

    for (const day of days) {
        if (!day.activities) continue;

        const original = day.activities.length;
        day.activities = day.activities.filter(act => {
            const title = (act.title || '').toLowerCase();
            const type = (act.type || '').toLowerCase();

            const isTransport = TRANSPORT_KEYWORDS.test(title) || ['transport', 'travel', 'flight', 'train'].includes(type);
            const isAccommodation = ACCOMMODATION_KEYWORDS.test(title) || ['accommodation', 'hotel', 'stay'].includes(type);

            if (isTransport || isAccommodation) {
                removed.push({ title: act.title, type: act.type, reason: isTransport ? 'transport' : 'accommodation' });
                return false;
            }
            return true;
        });

        if (day.activities.length < original) {
            if (import.meta.env.DEV) console.log(`[Sanitizer] Removed ${original - day.activities.length} rogue items from day`);
        }
    }

    if (removed.length > 0) {
        console.warn('[Sanitizer] Removed rogue AI items:', removed);
    }

    return days;
}

// ── Phase 8: Daily Cost Summary ──────────────────────────────────────

function computeDailySummary(segments, totalDays) {
    const summary = [];

    for (let day = 1; day <= totalDays; day++) {
        const daySegs = segments.filter(s => s.day_number === day);

        const activityCost = daySegs
            .filter(s => s.type === 'activity')
            .reduce((sum, s) => sum + (parseFloat(s.estimated_cost) || 0), 0);

        const transportCost = daySegs
            .filter(s => ['outbound_travel', 'return_travel', 'intercity_travel', 'local_transport'].includes(s.type))
            .reduce((sum, s) => sum + (parseFloat(s.estimated_cost) || 0), 0);

        const stayCost = daySegs
            .filter(s => s.type === 'accommodation')
            .reduce((sum, s) => sum + (parseFloat(s.estimated_cost) || 0), 0);

        const totalDayCost = activityCost + transportCost + stayCost;

        summary.push({
            day_number: day,
            activity_cost: Math.round(activityCost),
            local_transport_cost: Math.round(
                daySegs.filter(s => s.type === 'local_transport')
                    .reduce((sum, s) => sum + (parseFloat(s.estimated_cost) || 0), 0)
            ),
            travel_cost: Math.round(
                daySegs.filter(s => ['outbound_travel', 'return_travel', 'intercity_travel'].includes(s.type))
                    .reduce((sum, s) => sum + (parseFloat(s.estimated_cost) || 0), 0)
            ),
            stay_cost: Math.round(stayCost),
            total_day_cost: Math.round(totalDayCost),
            segment_count: daySegs.length,
        });
    }

    return summary;
}

// ── Main Orchestrator ────────────────────────────────────────────────

/**
 * Orchestrate full trip generation.
 *
 * @param {object} trip — Trip object from store (with segments, days, constraints)
 * @param {object} callbacks — Optional progress callbacks
 * @param {function} callbacks.onPhase — Called with (phaseNumber, phaseName) at each phase start
 * @returns {Promise<OrchestrationResult>}
 */
export async function orchestrateTrip(trip, callbacks = {}) {
    const { onPhase } = callbacks;
    const allSegments = [];

    const tripSegments = trip.segments || [{ location: trip.destination, days: trip.days?.length || 1 }];
    const totalDays = tripSegments.reduce((sum, s) => sum + (s.days || 0), 0);
    const totalNights = Math.max(0, totalDays - 1);
    const currency = trip.currency || 'USD';
    const currencyRate = CURRENCY_MULTIPLIERS[currency] || 1;

    // Single normalization point — all phases use these values
    const { normalizedStyle, normalizedTier, userStyle, hasOwnVehicle, pace } = normalizeTrip(trip);
    const budgetTier = normalizedTier;    // 'budget' | 'mid-range' | 'luxury'
    const travelStyle = normalizedStyle;  // 'relaxation' | 'city_explorer' | 'road_trip' | 'business'

    if (import.meta.env.DEV) console.log('[Orchestrator] Normalized:', { userStyle, travelStyle, budgetTier, hasOwnVehicle, pace });

    // Build day-to-location mapping
    const dayLocations = [];
    let dayCount = 0;
    tripSegments.forEach(seg => {
        for (let i = 0; i < (seg.days || 0); i++) {
            dayCount++;
            dayLocations.push({ dayNumber: dayCount, location: seg.location });
        }
    });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // PHASE 1: Budget Allocation
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    onPhase?.(1, 'Budget Allocation');

    const allocation = allocateBudget(trip.budget || 0, {
        travelStyle,
        budgetTier,
        totalDays,
        totalNights,
        travelers: trip.travelers || 1,
        hasOwnVehicle,
    });

    if (import.meta.env.DEV) console.log('[Orchestrator] Phase 1 — Budget allocated:', allocation);

    // ── Fix Group 4: Zero or insufficient budget guard ──
    if ((trip.budget || 0) <= 0) {
        console.warn('[Orchestrator] Budget is 0 or negative — returning minimal structure');
        return {
            allocation,
            segments: [],
            daily_summary: [],
            hidden_gems: [],
            reconciliation: { balanced: true, total: 0, budget: 0, overshoot: 0, buffer_remaining: 0, category_totals: {}, category_violations: [] },
        };
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // PHASE 2: Outbound Travel
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    onPhase?.(2, 'Outbound + Intercity Travel');

    const outbound = buildOutboundSegment(trip, allocation, currencyRate);
    if (outbound) {
        allSegments.push(outbound);
    }

    // Inter-city segments (multi-city trips)
    const intercity = buildIntercitySegments(trip, allocation, currencyRate);
    allSegments.push(...intercity);

    if (import.meta.env.DEV) console.log('[Orchestrator] Phase 2 — Travel segments:', 1 + intercity.length);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // PHASE 3: Accommodation
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    onPhase?.(3, 'Accommodation');

    const accommodation = buildAccommodationSegments(trip, allocation, currencyRate, dayLocations);
    allSegments.push(...accommodation);

    if (import.meta.env.DEV) console.log('[Orchestrator] Phase 3 — Accommodation:', accommodation.length, 'nights');

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // PHASE 4: Activity Generation (AI)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    onPhase?.(4, 'Generating Activities');

    const activityBudget = allocation.activity;
    const activityPerDay = allocation.activity_per_day;

    let aiPlan;
    try {
        // Determine if outbound/return transport exists
        const hasOutbound = !!(trip.start_location && trip.destination &&
            trip.start_location.toLowerCase() !== trip.destination.toLowerCase());
        const hasReturn = !!(trip.return_location || trip.start_location) && hasOutbound;

        aiPlan = await generateTripPlan(
            trip.destination,
            totalDays,
            trip.budget || 2000,
            trip.travelers || 1,
            currency,
            // ALWAYS use dayLocations (derived from trip.segments → trip.destination)
            // trip.days may contain wrong locations (e.g., start_location instead of destination)
            dayLocations.map(dl => ({ dayNumber: dl.dayNumber, location: dl.location })),
            budgetTier,
            // Lifecycle + context fields for constrained generation
            {
                activityBudget,
                activityPerDay,
                travelStyle,
                pace,
                excludeTransport: true,
                excludeAccommodation: true,
                // Trip logistics context
                startLocation: trip.start_location || '',
                hasOutboundTransport: hasOutbound,
                hasReturnTransport: hasReturn,
            }
        );
    } catch (err) {
        console.error('[Orchestrator] Phase 4 — AI generation failed:', err);
        aiPlan = { days: [] };
    }

    // ── Phase 4a: Sanitize AI response (Fix Group 3) ──
    if (aiPlan?.days) {
        sanitizeAIActivities(aiPlan.days);
    }

    // Convert AI activities to segment rows
    const activitySegments = [];
    if (aiPlan?.days) {
        aiPlan.days.forEach((genDay, dayIndex) => {
            const dayNumber = dayIndex + 1;
            const dayLocation = dayLocations[dayIndex]?.location || trip.destination;

            (genDay.activities || []).forEach((act, idx) => {
                activitySegments.push({
                    trip_id: trip.id,
                    type: 'activity',
                    title: act.title,
                    day_number: dayNumber,
                    location: act.location || dayLocation,
                    estimated_cost: parseFloat(act.estimated_cost) || 0,
                    order_index: idx,
                    metadata: {
                        time: act.time || '09:00',
                        activityType: act.type || 'sightseeing',
                        notes: act.notes || '',
                        safety_warning: act.safety_warning || null,
                        isCompleted: false,
                        rating: 0,
                    },
                });
            });
        });
    }

    // ── Phase 4b: Activity budget enforcement (Fix Group 2) ──
    const totalActivityCost = activitySegments.reduce((s, a) => s + (a.estimated_cost || 0), 0);
    if (totalActivityCost > activityBudget && activityBudget > 0) {
        const scaleFactor = activityBudget / totalActivityCost;
        console.warn(`[Orchestrator] Phase 4b — Activity overshoot: ${totalActivityCost} > ${activityBudget}. Scaling by ${scaleFactor.toFixed(2)}`);
        for (const seg of activitySegments) {
            seg.estimated_cost = Math.round((seg.estimated_cost || 0) * scaleFactor);
        }
    }
    // Deduct activity costs from envelope
    const finalActivityCost = activitySegments.reduce((s, a) => s + (a.estimated_cost || 0), 0);
    deductFromEnvelope(allocation, 'activity', finalActivityCost);

    // ── Phase 4c: Geocoding (Fix Group 1) ──
    onPhase?.(4.5, 'Geocoding Activities');
    await enrichActivitiesWithCoordinates(activitySegments, dayLocations);

    const geocodedCount = activitySegments.filter(s => s.latitude && s.longitude).length;
    const failedCount = activitySegments.filter(s => s.metadata?.geocode_failed).length;
    if (import.meta.env.DEV) console.log(`[Orchestrator] Phase 4c — Geocoded: ${geocodedCount}, Failed: ${failedCount}`);

    // ── Phase 4d: Feasibility Guard ──
    onPhase?.(4.7, 'Feasibility Check');

    const guardResult = applyFeasibilityGuard({
        trip,
        activitySegments,
        transportSegments: allSegments.filter(s => ['outbound_travel', 'intercity_travel', 'return_travel'].includes(s.type)),
        travelStyle,
        budgetTier,
        currency,
        totalDays,
    });

    if (guardResult.issues.length > 0) {
        console.warn(`[Orchestrator] Phase 4d — Feasibility Guard: ${guardResult.issues.length} corrections`);
        guardResult.issues.forEach(issue => console.warn(`  → ${issue}`));
    }

    allSegments.push(...activitySegments);
    if (import.meta.env.DEV) console.log('[Orchestrator] Phase 4 — Activities:', activitySegments.length);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // PHASE 5: Local Transport (pairwise)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    onPhase?.(5, 'Local Transport');

    // Group activities by day for pairwise insertion
    const localTransportSegments = [];
    for (let day = 1; day <= totalDays; day++) {
        const dayActivities = activitySegments
            .filter(s => s.day_number === day)
            .sort((a, b) => a.order_index - b.order_index);

        if (dayActivities.length >= 2) {
            const localSegs = insertPairwiseLocalTransport(
                dayActivities,
                trip.id,
                day,
                budgetTier,
                currency,
                allocation  // Fix Group 2: pass allocation for envelope deduction
            );
            localTransportSegments.push(...localSegs);
        }
    }

    allSegments.push(...localTransportSegments);
    if (import.meta.env.DEV) console.log('[Orchestrator] Phase 5 — Local transport:', localTransportSegments.length);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // PHASE 6: Return Travel
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    onPhase?.(6, 'Return Travel');

    const returnSeg = buildReturnSegment(trip, allocation, currencyRate, totalDays);
    if (returnSeg) {
        allSegments.push(returnSeg);
    }

    if (import.meta.env.DEV) console.log('[Orchestrator] Phase 6 — Return segment:', returnSeg ? 'added' : 'skipped');

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // PHASE 7: (Booking Suggestions — moved to post-insert in store)
    // Fix Group 4: suggestions need real DB UUIDs, so they're generated
    // in generateFullItinerary() after bulk insert + .select()
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    onPhase?.(7, 'Preparing Booking Data');
    if (import.meta.env.DEV) console.log('[Orchestrator] Phase 7 — Booking suggestions deferred to post-insert');

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // PHASE 8: Daily Cost Summary
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    onPhase?.(8, 'Daily Cost Summary');

    const dailySummary = computeDailySummary(allSegments, totalDays);

    if (import.meta.env.DEV) console.log('[Orchestrator] Phase 8 — Daily summaries:', dailySummary.length);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // PHASE 9: Hidden Gems (AI, isolated)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    onPhase?.(9, 'Hidden Gems');

    let hiddenGems = [];
    try {
        hiddenGems = await getHiddenGems(trip.destination, {
            budgetTier,
            travelStyle,
            currency,
        });
    } catch (err) {
        console.warn('[Orchestrator] Phase 9 — Hidden gems fetch failed:', err);
    }

    // Ensure gems have required fields
    hiddenGems = (hiddenGems || []).map(gem => ({
        ...gem,
        estimated_cost: gem.estimated_cost || 0,
        safety_note: gem.safety_note || gem.safety_warning || null,
        _isolated: true, // Flag: not part of budget or itinerary
    }));

    if (import.meta.env.DEV) console.log('[Orchestrator] Phase 9 — Hidden gems:', hiddenGems.length);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // PHASE 10: Budget Reconciliation
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    onPhase?.(10, 'Budget Reconciliation');

    let reconciliation = reconcileBudget(allocation, allSegments);

    // Auto-correct: if overshoot detected, progressively trim non-essential segments
    if (!reconciliation.balanced && reconciliation.overshoot > 0) {
        console.warn(
            `[Orchestrator] Phase 10 — Budget overshoot detected: ${reconciliation.overshoot} ${currency}. Auto-correcting...`
        );

        // Trimmable types in priority order (least essential first)
        const trimmableTypes = ['local_transport', 'activity'];
        let remaining = reconciliation.overshoot;

        for (const type of trimmableTypes) {
            if (remaining <= 0) break;

            // Find segments of this type, sorted cheapest first (trim small ones first)
            const candidates = allSegments
                .filter(s => s.type === type)
                .sort((a, b) => (a.estimated_cost || 0) - (b.estimated_cost || 0));

            for (const seg of candidates) {
                if (remaining <= 0) break;
                remaining -= (seg.estimated_cost || 0);
                const idx = allSegments.indexOf(seg);
                if (idx !== -1) allSegments.splice(idx, 1);
            }
        }

        // Re-reconcile after auto-correction
        reconciliation = reconcileBudget(allocation, allSegments);
        if (import.meta.env.DEV) console.log(`[Orchestrator] Phase 10 — After auto-correction: balanced=${reconciliation.balanced}, total=${reconciliation.total}`);
    }

    if (!reconciliation.balanced) {
        console.warn(
            `[Orchestrator] Phase 10 — Budget ISSUE (post-correction): overshoot=${reconciliation.overshoot} ${currency}, violations=`,
            reconciliation.category_violations
        );
    } else {
        if (import.meta.env.DEV) console.log('[Orchestrator] Phase 10 — Budget reconciled ✓');
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // FIX GROUP 5: Explicit final sort
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    allSegments.sort((a, b) =>
        (a.day_number || 0) - (b.day_number || 0) ||
        (a.order_index || 0) - (b.order_index || 0)
    );

    // Re-index order_index to sequential integers per day
    // (local transport uses fractional 0.5 offsets for sorting, but DB column is integer)
    let currentDay = -1;
    let idx = 0;
    for (const seg of allSegments) {
        if (seg.day_number !== currentDay) {
            currentDay = seg.day_number;
            idx = 0;
        }
        seg.order_index = idx++;
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // RETURN CONTRACT OUTPUT
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    return {
        allocation,
        segments: allSegments,
        daily_summary: dailySummary,
        hidden_gems: hiddenGems,
        reconciliation,
        // booking_options generated post-insert in store (Fix Group 4)
    };
}
