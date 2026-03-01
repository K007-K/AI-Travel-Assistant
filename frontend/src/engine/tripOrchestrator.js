/**
 * Trip Orchestrator — LLM-First Architecture
 *
 * Single entry point: `orchestrateTrip(trip)`
 *
 * Simplified 3-phase pipeline:
 *   1. Context Building (budget + OSRM overnight detection)
 *   2. LLM Generation (complete itinerary: transport + activities + meals)
 *   3. Parse & Enrich (convert LLM JSON → UI segments + geocode)
 *
 * The LLM generates EVERYTHING: intercity transport, activities, meals, tips.
 * No more deterministic cost tables, distance tiers, or budget envelopes.
 *
 * @module engine/tripOrchestrator
 */

import { buildTravelTimeline } from './travelTimelineBuilder.js';
import { generateTripPlan, getHiddenGems } from '../api/groq.js';
import {
    normalizeTrip,
    deriveTripConstraints,
} from '../utils/tripDefaults.js';
import { getCityCoords } from '../data/cityCoordinates.js';

// In-memory cache for the current session
const _geocodeMemCache = {};

// localStorage cache helpers (30-day TTL)
const GEO_CACHE_KEY = 'geocode_cache_v2';

function _getGeoCache() {
    try {
        const raw = localStorage.getItem(GEO_CACHE_KEY);
        if (!raw) return {};
        const cache = JSON.parse(raw);
        const now = Date.now();
        const thirtyDays = 30 * 24 * 60 * 60 * 1000;
        for (const key of Object.keys(cache)) {
            if (now - (cache[key]._ts || 0) > thirtyDays) delete cache[key];
        }
        return cache;
    } catch {
        return {};
    }
}

function _setGeoCache(key, coords) {
    try {
        const cache = _getGeoCache();
        cache[key] = { ...coords, _ts: Date.now() };
        localStorage.setItem(GEO_CACHE_KEY, JSON.stringify(cache));
    } catch { /* quota exceeded, etc */ }
}

// Fetch coordinates from OpenStreetMap Nominatim API.
async function _fetchFromNominatim(query) {
    try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
        const res = await fetch(url, {
            headers: { 'User-Agent': 'AITravelAssistant/1.0' }
        });
        if (!res.ok) return null;
        const results = await res.json();
        if (results.length > 0) {
            return { latitude: parseFloat(results[0].lat), longitude: parseFloat(results[0].lon) };
        }
        return null;
    } catch {
        return null;
    }
}

/**
 * Geocode a location string.
 * Strategy: memcache → localStorage → KNOWN_CITIES → Nominatim
 */
async function geocodeLocation(location, activityHint = '', cityContext = '') {
    if (!location) return null;

    const cacheKey = location.toLowerCase().trim();

    // 1. In-memory cache
    if (_geocodeMemCache[cacheKey]) return _geocodeMemCache[cacheKey];

    // 2. localStorage cache
    const diskCache = _getGeoCache();
    if (diskCache[cacheKey]) {
        const { _ts, ...coords } = diskCache[cacheKey];
        _geocodeMemCache[cacheKey] = coords;
        return coords;
    }

    // 3. KNOWN_CITIES exact match
    const knownCoords = getCityCoords(location);
    if (knownCoords) {
        const result = _applyOffset(knownCoords, activityHint || location);
        _geocodeMemCache[cacheKey] = result;
        _setGeoCache(cacheKey, result);
        return result;
    }

    // 4. Nominatim API
    const queries = [
        cityContext ? `${location}, ${cityContext}` : location,
        location,
    ];

    for (const q of queries) {
        const result = await _fetchFromNominatim(q);
        if (result) {
            _geocodeMemCache[cacheKey] = result;
            _setGeoCache(cacheKey, result);
            return result;
        }
    }

    return null;
}

// Apply deterministic ±0.01° (~1km) offset to base coords.
function _applyOffset(baseCoords, hintStr) {
    let hash = 0;
    const str = String(hintStr || '');
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
    }
    const latOffset = ((hash % 100) / 10000);
    const lngOffset = (((hash >> 8) % 100) / 10000);
    return {
        latitude: baseCoords.latitude + latOffset,
        longitude: baseCoords.longitude + lngOffset,
    };
}

/**
 * Enrich segments with geocoded coordinates.
 */
async function enrichActivitiesWithCoordinates(segments, dayLocations = []) {
    const locationMap = {};
    dayLocations.forEach(dl => { locationMap[dl.dayNumber] = dl.location; });

    for (const seg of segments) {
        if (seg.latitude && seg.longitude) continue;
        if (['outbound_travel', 'return_travel'].includes(seg.type)) continue;

        const cityContext = locationMap[seg.day_number] || '';
        const coords = await geocodeLocation(
            seg.location || seg.title,
            seg.title,
            cityContext
        );

        if (coords) {
            seg.latitude = coords.latitude;
            seg.longitude = coords.longitude;
            // Also store in metadata for Supabase persistence
            seg.metadata = seg.metadata || {};
            seg.metadata.latitude = coords.latitude;
            seg.metadata.longitude = coords.longitude;
        } else {
            seg.metadata = seg.metadata || {};
            seg.metadata.geocode_failed = true;
        }
    }
}

// ── Daily Cost Summary ──────────────────────────────────────────────

function computeDailySummary(segments, totalDays) {
    const summary = [];
    for (let d = 1; d <= totalDays; d++) {
        const daySegs = segments.filter(s => s.day_number === d);
        const activityCost = daySegs
            .filter(s => s.type === 'activity')
            .reduce((s, a) => s + (a.estimated_cost || 0), 0);
        const transportCost = daySegs
            .filter(s => ['outbound_travel', 'return_travel', 'intercity_travel', 'local_transport'].includes(s.type))
            .reduce((s, a) => s + (a.estimated_cost || 0), 0);
        const accommodationCost = daySegs
            .filter(s => s.type === 'accommodation')
            .reduce((s, a) => s + (a.estimated_cost || 0), 0);

        summary.push({
            day_number: d,
            activity_cost: Math.round(activityCost),
            transport_cost: Math.round(transportCost),
            accommodation_cost: Math.round(accommodationCost),
            total: Math.round(activityCost + transportCost + accommodationCost),
        });
    }
    return summary;
}

// ── Main Orchestrator ────────────────────────────────────────────────

/**
 * Orchestrate full trip generation — LLM-first architecture.
 *
 * @param {object} trip — Trip object from store
 * @param {object} callbacks — Optional progress callbacks
 * @returns {Promise<OrchestrationResult>}
 */
export async function orchestrateTrip(trip, callbacks = {}) {
    const { onPhase } = callbacks;

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // PHASE 1: Context Building
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    onPhase?.(1, 'Building Context');

    const { normalizedTier, normalizedStyle } = normalizeTrip(trip);
    // Map engine tier → LLM-facing tier name
    const budgetTier = normalizedTier === 'low' ? 'budget' : normalizedTier === 'high' ? 'luxury' : 'mid-range';
    const travelStyle = normalizedStyle;
    const currency = trip.currency || 'INR';
    const travelers = trip.travelers || 1;

    // Derive budget from trip defaults
    const constraints = deriveTripConstraints(trip);
    const totalBudget = trip.budget || constraints.totalBudget || 2000;
    const _budgetPerPerson = travelers > 1 ? Math.round(totalBudget / travelers) : totalBudget;

    // Compute timeline from OSRM (real driving hours → overnight detection)
    const plannerTier = budgetTier === 'budget' ? 'low' : budgetTier === 'luxury' ? 'high' : 'mid';
    const tripSegments = trip.segments || [];
    const destinations = tripSegments.length > 0
        ? tripSegments.map(s => ({ location: s.location, days: s.days || 1 }))
        : [{ location: trip.destination, days: trip.duration_days || 1 }];

    const timeline = await buildTravelTimeline({
        startLocation: trip.start_location || '',
        returnLocation: trip.return_location || trip.start_location || '',
        destinations,
        budgetTier: plannerTier,
    });

    // Extract overnight context from timeline
    const firstExplore = timeline.find(t => t.type === 'EXPLORE');
    const overnightArrival = firstExplore?.overnightArrival || null;

    // Count exploration days (budget and activities scale on these)
    const exploreDays = timeline.filter(t => t.type === 'EXPLORE');
    const totalDays = timeline.length || 1;
    const explorationDays = exploreDays.length || 1;

    // Build day locations for geocoding and LLM schedule
    const dayLocations = timeline.map(slot => ({
        dayNumber: slot.day_number,
        location: slot.location || trip.destination,
        type: slot.type,
    }));

    const exploreDayLocations = exploreDays.map((slot, i) => ({
        dayNumber: i + 1,  // Sequential for LLM (Day 1, 2, 3...)
        calendarDay: slot.day_number,  // Actual calendar position
        location: slot.location || trip.destination,
    }));

    // Determine overnight context for LLM
    const isOvernightArrival = !!overnightArrival;
    const arrivalHours = overnightArrival?.hours || null;

    // Estimate arrival time based on travel hours
    let arrivalTime = null;
    let arrivalMode = null;
    if (isOvernightArrival) {
        // If train/bus takes 10-14h and departs ~21:00, arrives 05:00-07:00
        const departHour = 21;
        const arriveHour = (departHour + Math.round(arrivalHours || 10)) % 24;
        arrivalTime = `${String(arriveHour).padStart(2, '0')}:00`;
        arrivalMode = plannerTier === 'high' ? 'flight' : (arrivalHours >= 8 ? 'train' : 'bus');
    }

    // Check if return is also overnight (symmetric with outbound)
    const isOvernightDeparture = isOvernightArrival; // Same distance = same overnight status
    const departureTime = isOvernightDeparture ? '21:00' : null;
    const departureMode = arrivalMode;

    // Simple allocation for UI compatibility (no complex envelopes)
    const allocation = {
        total: totalBudget,
        intercity: Math.round(totalBudget * 0.15),
        accommodation: 0,
        local_transport: Math.round(totalBudget * 0.05),
        activity: Math.round(totalBudget * 0.65),
        buffer: Math.round(totalBudget * 0.15),
        // Remaining trackers for UI
        intercity_remaining: Math.round(totalBudget * 0.15),
        activity_remaining: Math.round(totalBudget * 0.65),
    };

    if (import.meta.env.DEV) {
        console.log(`[Orchestrator] Phase 1 — Budget: ${totalBudget} ${currency}, Days: ${explorationDays}, Overnight: ${isOvernightArrival}`);
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // PHASE 2: LLM Generation (the brain)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    onPhase?.(2, 'Generating Itinerary');

    let aiPlan;
    try {
        aiPlan = await generateTripPlan({
            destination: trip.destination,
            days: explorationDays,
            budget: totalBudget,
            travelers,
            currency,
            budgetTier,
            travelStyle,
            startLocation: trip.start_location || '',
            // Overnight context
            isOvernightArrival,
            arrivalTime,
            arrivalMode,
            isOvernightDeparture,
            departureTime,
            departureMode,
            hasAccommodation: false, // day trips for now
            travelHours: arrivalHours,
            // Multi-city schedule
            tripDays: exploreDayLocations.map(dl => ({
                dayNumber: dl.dayNumber,
                location: dl.location,
            })),
        });
    } catch (err) {
        console.error('[Orchestrator] Phase 2 — AI generation failed:', err);
        aiPlan = { days: [] };
    }

    if (import.meta.env.DEV) {
        console.log('[Orchestrator] Phase 2 — AI plan:', {
            outbound: aiPlan?.outbound_transport?.mode,
            days: aiPlan?.days?.length,
            activities: aiPlan?.days?.reduce((s, d) => s + (d.activities?.length || 0), 0),
            return: aiPlan?.return_transport?.mode,
            total: aiPlan?.total_per_person,
        });
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // PHASE 3: Parse & Enrich
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    onPhase?.(3, 'Building Itinerary');

    const allSegments = [];

    // 3a: Outbound transport from LLM
    if (aiPlan?.outbound_transport && aiPlan.outbound_transport.mode !== 'none') {
        const ob = aiPlan.outbound_transport;
        allSegments.push({
            trip_id: trip.id,
            type: 'outbound_travel',
            title: ob.title || `${ob.is_overnight ? '🌙 Overnight ' : ''}${ob.mode} — ${trip.start_location} → ${trip.destination}`,
            day_number: 1,
            location: trip.start_location || trip.destination,
            estimated_cost: ob.cost_per_person || 0,
            order_index: -1,  // Always first
            metadata: {
                transport_mode: ob.mode,
                from: trip.start_location,
                to: trip.destination,
                isOvernight: ob.is_overnight || false,
                departure: ob.departure,
                arrival: ob.arrival,
                per_person: ob.cost_per_person || 0,
                notes: ob.notes || '',
            },
        });
    }

    // 3b: Activities from LLM (day by day)
    if (aiPlan?.days) {
        aiPlan.days.forEach((genDay, dayIndex) => {
            const exploreSlot = exploreDayLocations[dayIndex];
            const calendarDay = exploreSlot?.calendarDay || (dayIndex + 1);
            const dayLocation = exploreSlot?.location || trip.destination;

            (genDay.activities || []).forEach((act, idx) => {
                allSegments.push({
                    trip_id: trip.id,
                    type: 'activity',
                    title: act.title,
                    day_number: calendarDay,
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

    // 3c: Return transport from LLM
    if (aiPlan?.return_transport && aiPlan.return_transport.mode !== 'none') {
        const rt = aiPlan.return_transport;
        allSegments.push({
            trip_id: trip.id,
            type: 'return_travel',
            title: rt.title || `${rt.is_overnight ? '🌙 Overnight ' : ''}${rt.mode} — ${trip.destination} → ${trip.start_location}`,
            day_number: totalDays,
            location: trip.destination,
            estimated_cost: rt.cost_per_person || 0,
            order_index: 1000,  // Always last
            metadata: {
                transport_mode: rt.mode,
                from: trip.destination,
                to: trip.start_location || trip.return_location,
                isOvernight: rt.is_overnight || false,
                departure: rt.departure,
                arrival: rt.arrival,
                per_person: rt.cost_per_person || 0,
                notes: rt.notes || '',
            },
        });
    }

    // 3d: Geocode activities for map pins
    onPhase?.(3.5, 'Geocoding');
    await enrichActivitiesWithCoordinates(allSegments, dayLocations);

    // 3e: Sort by day → time
    allSegments.sort((a, b) => {
        if (a.day_number !== b.day_number) return a.day_number - b.day_number;
        // outbound_travel always first, return_travel always last
        if (a.type === 'outbound_travel') return -1;
        if (b.type === 'outbound_travel') return 1;
        if (a.type === 'return_travel') return 1;
        if (b.type === 'return_travel') return -1;
        // Activities: sort by time
        const timeA = a.metadata?.time || '09:00';
        const timeB = b.metadata?.time || '09:00';
        return timeA.localeCompare(timeB);
    });

    // Re-index order_index to sequential integers per day
    let currentDay = -1;
    let idx = 0;
    for (const seg of allSegments) {
        if (seg.day_number !== currentDay) {
            currentDay = seg.day_number;
            idx = 0;
        }
        seg.order_index = idx++;
    }

    if (import.meta.env.DEV) {
        console.log(`[Orchestrator] Phase 3 — Total segments: ${allSegments.length}`);
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // PHASE 4: Hidden Gems (isolated AI call)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    onPhase?.(4, 'Hidden Gems');

    let hiddenGems = [];
    try {
        hiddenGems = await getHiddenGems(trip.destination, {
            budgetTier,
            travelStyle,
            currency,
        });
    } catch (err) {
        console.warn('[Orchestrator] Phase 4 — Hidden gems fetch failed:', err);
    }

    hiddenGems = (hiddenGems || []).map(gem => ({
        ...gem,
        estimated_cost: gem.estimated_cost || 0,
        safety_note: gem.safety_note || gem.safety_warning || null,
        _isolated: true,
    }));

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // PHASE 5: Daily Cost Summary
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    onPhase?.(5, 'Finalizing');

    const dailySummary = computeDailySummary(allSegments, totalDays);

    // Simple reconciliation (LLM should stay within budget, but check)
    const totalCost = allSegments.reduce((s, seg) => s + (seg.estimated_cost || 0), 0);
    const reconciliation = {
        balanced: totalCost <= totalBudget,
        total: Math.round(totalCost),
        overshoot: Math.max(0, Math.round(totalCost - totalBudget)),
        category_violations: [],
    };

    if (import.meta.env.DEV) {
        console.log(`[Orchestrator] Done — ${allSegments.length} segments, cost: ${totalCost}/${totalBudget} ${currency}`);
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // RETURN — same contract as before for store compatibility
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    return {
        allocation,
        segments: allSegments,
        daily_summary: dailySummary,
        hidden_gems: hiddenGems,
        reconciliation,
    };
}
