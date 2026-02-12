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
import {
    buildOutboundSegment,
    buildReturnSegment,
    buildIntercitySegments,
    buildAccommodationSegments,
    insertPairwiseLocalTransport,
    CURRENCY_MULTIPLIERS,
} from '../utils/transportEngine.js';
import { generateTripPlan, getHiddenGems } from '../api/groq.js';

// ── Deterministic Geocoder (Phase 4c) ────────────────────────────────

/**
 * Deterministic coordinate lookup for a location string.
 * Uses a simple city-name hash to generate plausible coordinates.
 * No external API — fast and offline-capable.
 *
 * @param {string} location — City or place name
 * @returns {{ latitude: number, longitude: number } | null}
 */
function geocodeLocation(location, activityHint = '') {
    if (!location || typeof location !== 'string') return null;

    // Well-known city coordinates for common destinations
    const KNOWN_CITIES = {
        'paris': { latitude: 48.8566, longitude: 2.3522 },
        'london': { latitude: 51.5074, longitude: -0.1278 },
        'new york': { latitude: 40.7128, longitude: -74.0060 },
        'tokyo': { latitude: 35.6762, longitude: 139.6503 },
        'dubai': { latitude: 25.2048, longitude: 55.2708 },
        'mumbai': { latitude: 19.0760, longitude: 72.8777 },
        'delhi': { latitude: 28.6139, longitude: 77.2090 },
        'new delhi': { latitude: 28.6139, longitude: 77.2090 },
        'bangalore': { latitude: 12.9716, longitude: 77.5946 },
        'bengaluru': { latitude: 12.9716, longitude: 77.5946 },
        'hyderabad': { latitude: 17.3850, longitude: 78.4867 },
        'chennai': { latitude: 13.0827, longitude: 80.2707 },
        'kolkata': { latitude: 22.5726, longitude: 88.3639 },
        'goa': { latitude: 15.2993, longitude: 74.1240 },
        'jaipur': { latitude: 26.9124, longitude: 75.7873 },
        'agra': { latitude: 27.1767, longitude: 78.0081 },
        'varanasi': { latitude: 25.3176, longitude: 82.9739 },
        'udaipur': { latitude: 24.5854, longitude: 73.7125 },
        'shimla': { latitude: 31.1048, longitude: 77.1734 },
        'manali': { latitude: 32.2396, longitude: 77.1887 },
        'pune': { latitude: 18.5204, longitude: 73.8567 },
        'coorg': { latitude: 12.3375, longitude: 75.8069 },
        'mysore': { latitude: 12.2958, longitude: 76.6394 },
        'mysuru': { latitude: 12.2958, longitude: 76.6394 },
        'kochi': { latitude: 9.9312, longitude: 76.2673 },
        'bangkok': { latitude: 13.7563, longitude: 100.5018 },
        'singapore': { latitude: 1.3521, longitude: 103.8198 },
        'bali': { latitude: -8.3405, longitude: 115.0920 },
        'rome': { latitude: 41.9028, longitude: 12.4964 },
        'barcelona': { latitude: 41.3874, longitude: 2.1686 },
        'amsterdam': { latitude: 52.3676, longitude: 4.9041 },
        'sydney': { latitude: -33.8688, longitude: 151.2093 },
        'san francisco': { latitude: 37.7749, longitude: -122.4194 },
        'los angeles': { latitude: 34.0522, longitude: -118.2437 },
        'istanbul': { latitude: 41.0082, longitude: 28.9784 },
        'cairo': { latitude: 30.0444, longitude: 31.2357 },
        'cape town': { latitude: -33.9249, longitude: 18.4241 },
        'rio de janeiro': { latitude: -22.9068, longitude: -43.1729 },
        'berlin': { latitude: 52.5200, longitude: 13.4050 },
        'vienna': { latitude: 48.2082, longitude: 16.3738 },
        'prague': { latitude: 50.0755, longitude: 14.4378 },
        'seoul': { latitude: 37.5665, longitude: 126.9780 },
        'kuala lumpur': { latitude: 3.1390, longitude: 101.6869 },
        'hong kong': { latitude: 22.3193, longitude: 114.1694 },
        'lisbon': { latitude: 38.7223, longitude: -9.1393 },
        'athens': { latitude: 37.9838, longitude: 23.7275 },
        'zurich': { latitude: 47.3769, longitude: 8.5417 },
        'vancouver': { latitude: 49.2827, longitude: -123.1207 },
        'toronto': { latitude: 43.6532, longitude: -79.3832 },
        'miami': { latitude: 25.7617, longitude: -80.1918 },
        'hawaii': { latitude: 19.8968, longitude: -155.5828 },
        'maldives': { latitude: 3.2028, longitude: 73.2207 },
        'switzerland': { latitude: 46.8182, longitude: 8.2275 },
        'kerala': { latitude: 10.8505, longitude: 76.2711 },
        'kashmir': { latitude: 34.0837, longitude: 74.7973 },
        'rishikesh': { latitude: 30.0869, longitude: 78.2676 },
        'pondicherry': { latitude: 11.9416, longitude: 79.8083 },
        'mysore': { latitude: 12.2958, longitude: 76.6394 },
        'kochi': { latitude: 9.9312, longitude: 76.2673 },
        'leh': { latitude: 34.1526, longitude: 77.5771 },
        'ladakh': { latitude: 34.1526, longitude: 77.5771 },
        'ooty': { latitude: 11.4102, longitude: 76.6950 },
        'darjeeling': { latitude: 27.0410, longitude: 88.2663 },
    };

    const normalized = location.toLowerCase().trim();

    // Look up base coordinates (exact or partial match)
    let baseCoords = null;
    if (KNOWN_CITIES[normalized]) {
        baseCoords = KNOWN_CITIES[normalized];
    } else {
        for (const [city, coords] of Object.entries(KNOWN_CITIES)) {
            if (normalized.includes(city) || city.includes(normalized)) {
                baseCoords = coords;
                break;
            }
        }
    }

    if (baseCoords) {
        // Fix Group 3: Deterministic offset for same-city variation
        // Uses activity hint (title + time) to create ±0.01° (~1km) offset
        const hintStr = activityHint || normalized;
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

    // Deterministic hash fallback — generate plausible coords from string
    let hash = 0;
    for (let i = 0; i < normalized.length; i++) {
        hash = ((hash << 5) - hash + normalized.charCodeAt(i)) | 0;
    }
    // Map hash to plausible lat/lng range (avoiding oceans)
    const lat = ((hash & 0xFFFF) / 0xFFFF) * 120 - 40;  // -40 to 80
    const lng = (((hash >> 16) & 0xFFFF) / 0xFFFF) * 300 - 120; // -120 to 180

    return { latitude: Math.round(lat * 10000) / 10000, longitude: Math.round(lng * 10000) / 10000 };
}

/**
 * Phase 4c: Enrich AI activities with geocoded coordinates.
 *
 * @param {object[]} activitySegments — Activity segments from AI conversion
 * @returns {object[]} — Same array, mutated with latitude/longitude in metadata
 */
function enrichActivitiesWithCoordinates(activitySegments) {
    for (const seg of activitySegments) {
        // Fix Group 3: Pass activity title as hint for deterministic offset
        const hint = (seg.title || '') + '|' + (seg.metadata?.time_of_day || '') + '|' + (seg.order_index || 0);
        const coords = geocodeLocation(seg.location, hint);
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
            console.log(`[Sanitizer] Removed ${original - day.activities.length} rogue items from day`);
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
            .filter(s => ['outbound_travel', 'return_travel', 'local_transport'].includes(s.type))
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
                daySegs.filter(s => ['outbound_travel', 'return_travel'].includes(s.type))
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
    const budgetTier = trip.accommodation_preference || 'mid-range';
    const travelStyle = trip.travel_style || '';
    const isLuxury = budgetTier === 'luxury';

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
        hasOwnVehicle: trip.own_vehicle_type && trip.own_vehicle_type !== 'none',
    });

    console.log('[Orchestrator] Phase 1 — Budget allocated:', allocation);

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
    onPhase?.(2, 'Outbound Travel');

    const outbound = buildOutboundSegment(trip, allocation, currencyRate);
    if (outbound) {
        allSegments.push(outbound);
    }

    // Inter-city segments (multi-city trips)
    const intercity = buildIntercitySegments(trip, allocation, currencyRate);
    allSegments.push(...intercity);

    console.log('[Orchestrator] Phase 2 — Travel segments:', 1 + intercity.length);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // PHASE 3: Accommodation
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    onPhase?.(3, 'Accommodation');

    const accommodation = buildAccommodationSegments(trip, allocation, currencyRate, dayLocations);
    allSegments.push(...accommodation);

    console.log('[Orchestrator] Phase 3 — Accommodation:', accommodation.length, 'nights');

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // PHASE 4: Activity Generation (AI)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    onPhase?.(4, 'Generating Activities');

    const activityBudget = allocation.activity;
    const activityPerDay = allocation.activity_per_day;

    let aiPlan;
    try {
        aiPlan = await generateTripPlan(
            trip.destination,
            totalDays,
            trip.budget || 2000,
            trip.travelers || 1,
            currency,
            trip.days || dayLocations.map(dl => ({ dayNumber: dl.dayNumber, location: dl.location })),
            budgetTier,
            // New fields for constrained generation
            {
                activityBudget,
                activityPerDay,
                travelStyle,
                excludeTransport: true,
                excludeAccommodation: true,
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
    enrichActivitiesWithCoordinates(activitySegments);

    const geocodedCount = activitySegments.filter(s => s.latitude && s.longitude).length;
    const failedCount = activitySegments.filter(s => s.metadata?.geocode_failed).length;
    console.log(`[Orchestrator] Phase 4c — Geocoded: ${geocodedCount}, Failed: ${failedCount}`);

    allSegments.push(...activitySegments);
    console.log('[Orchestrator] Phase 4 — Activities:', activitySegments.length);

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
    console.log('[Orchestrator] Phase 5 — Local transport:', localTransportSegments.length);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // PHASE 6: Return Travel
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    onPhase?.(6, 'Return Travel');

    const returnSeg = buildReturnSegment(trip, allocation, currencyRate, totalDays);
    if (returnSeg) {
        allSegments.push(returnSeg);
    }

    console.log('[Orchestrator] Phase 6 — Return segment:', returnSeg ? 'added' : 'skipped');

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // PHASE 7: (Booking Suggestions — moved to post-insert in store)
    // Fix Group 4: suggestions need real DB UUIDs, so they're generated
    // in generateFullItinerary() after bulk insert + .select()
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    onPhase?.(7, 'Preparing Booking Data');
    console.log('[Orchestrator] Phase 7 — Booking suggestions deferred to post-insert');

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // PHASE 8: Daily Cost Summary
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    onPhase?.(8, 'Daily Cost Summary');

    const dailySummary = computeDailySummary(allSegments, totalDays);

    console.log('[Orchestrator] Phase 8 — Daily summaries:', dailySummary.length);

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

    console.log('[Orchestrator] Phase 9 — Hidden gems:', hiddenGems.length);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // PHASE 10: Budget Reconciliation
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    onPhase?.(10, 'Budget Reconciliation');

    const reconciliation = reconcileBudget(allocation, allSegments);

    if (!reconciliation.balanced) {
        console.warn(
            `[Orchestrator] Phase 10 — Budget ISSUE: overshoot=${reconciliation.overshoot} ${currency}, violations=`,
            reconciliation.category_violations
        );
    } else {
        console.log('[Orchestrator] Phase 10 — Budget reconciled ✓');
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // FIX GROUP 5: Explicit final sort
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    allSegments.sort((a, b) =>
        (a.day_number || 0) - (b.day_number || 0) ||
        (a.order_index || 0) - (b.order_index || 0)
    );

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
