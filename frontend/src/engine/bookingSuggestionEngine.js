/**
 * Booking Suggestion Engine — Phase 7 of Trip Orchestration
 *
 * For each bookable segment (outbound_travel, accommodation, return_travel),
 * generates 3 scored booking options using the booking scorer's deterministic
 * seed logic. Optionally 4 options for luxury tier (includes upgrade).
 *
 * Rule 8: All results are labeled as "Estimated Results (Demo Mode)".
 *
 * @module engine/bookingSuggestionEngine
 */

import {
    generateFlightResults,
    generateHotelResults,
    generateTrainResults,
    BOOKING_DEMO_LABEL,
} from '../utils/bookingScorer.js';

// ── Option Generation ────────────────────────────────────────────────

/**
 * Generate booking options for a single segment.
 *
 * @param {object} segment    — A trip_segment (outbound_travel, accommodation, or return_travel)
 * @param {number} currencyRate — Currency multiplier (relative to USD)
 * @param {object} options
 * @param {boolean} options.isLuxury — If true, include a 4th premium upgrade option
 * @returns {{ segment_id: string, segment_type: string, options: BookingOption[], demo_label: string }}
 */
export function suggestBookingsForSegment(segment, currencyRate = 1, options = {}) {
    const { isLuxury = false, upgradePool = 0 } = options;
    const meta = segment.metadata || {};

    let rawResults = [];

    if (segment.type === 'outbound_travel' || segment.type === 'return_travel') {
        const mode = meta.transport_mode || 'train';
        const formData = {
            origin: meta.from || '',
            destination: meta.to || '',
            date: new Date().toISOString().split('T')[0],
        };

        if (mode === 'flight') {
            rawResults = generateFlightResults(formData, currencyRate);
        } else if (mode === 'train' || mode === 'bus') {
            formData.trainClass = mode === 'train' ? '2A' : 'SL';
            rawResults = generateTrainResults(formData, currencyRate);
        } else {
            // car/bike — no booking options, return fuel estimate
            return {
                segment_id: segment.id || `seg-${segment.day_number}-${segment.order_index}`,
                segment_type: segment.type,
                options: [{
                    option_id: 'own-vehicle-1',
                    provider: meta.transport_mode === 'bike' ? 'Own Bike' : 'Own Car',
                    estimated_price: segment.estimated_cost || 0,
                    rating: null,
                    duration: meta.distance_tier || 'varies',
                    score: 100,
                    tag: 'Best',
                }],
                demo_label: BOOKING_DEMO_LABEL,
            };
        }
    } else if (segment.type === 'accommodation') {
        const formData = {
            destination: segment.location || meta.location || '',
            date: new Date().toISOString().split('T')[0],
        };
        rawResults = generateHotelResults(formData, currencyRate);
    }

    if (rawResults.length === 0) {
        return {
            segment_id: segment.id || `seg-${segment.day_number}-${segment.order_index}`,
            segment_type: segment.type,
            options: [],
            demo_label: BOOKING_DEMO_LABEL,
        };
    }

    // Sort by score descending, take top 3
    const sorted = [...rawResults].sort((a, b) => (b.score || 0) - (a.score || 0));
    const baseCount = Math.min(3, sorted.length);
    const topResults = sorted.slice(0, baseCount);

    const bookingOptions = topResults.map((r, idx) => ({
        option_id: r.id || `opt-${idx}`,
        provider: r.airline || r.name || r.trainName || 'Provider',
        estimated_price: r.price || 0,
        rating: r.rating || r.onTimeRate || null,
        duration: r.duration || null,
        score: r.score || 0,
        tag: idx === 0 ? 'Best' : null,
        tier: r.tier || r.trainTier || null,
        raw: r, // Full result for UI rendering
    }));

    // Fix Group 7: Luxury upgrade option — consume upgrade_pool
    if (isLuxury && upgradePool > 0 && sorted.length > 0) {
        const bestResult = sorted[0];
        const upgradePortionPerSegment = Math.round(upgradePool / Math.max(1, options._bookableCount || 3));
        const upgradedPrice = (bestResult.price || 0) + upgradePortionPerSegment;

        bookingOptions.push({
            option_id: `opt-upgrade`,
            provider: (bestResult.airline || bestResult.name || bestResult.trainName || 'Provider') + ' Premium',
            estimated_price: upgradedPrice,
            rating: bestResult.rating || bestResult.onTimeRate || null,
            duration: bestResult.duration || null,
            score: (bestResult.score || 0) + 5,
            tag: 'Upgrade Available',
            tier: 'premium',
            raw: { ...bestResult, upgraded: true, upgrade_amount: upgradePortionPerSegment },
        });
    }

    return {
        segment_id: segment.id || `seg-${segment.day_number}-${segment.order_index}`,
        segment_type: segment.type,
        options: bookingOptions,
        demo_label: BOOKING_DEMO_LABEL,
    };
}

// ── Bulk Generation ──────────────────────────────────────────────────

/**
 * Generate booking suggestions for ALL bookable segments in a trip.
 *
 * @param {object[]} segments     — All trip_segments
 * @param {number}   currencyRate — Currency multiplier
 * @param {object}   options
 * @param {boolean}  options.isLuxury — High budget mode
 * @param {number}   options.upgradePool — Luxury upgrade pool from allocation
 * @returns {Object<string, BookingSuggestion>} — Keyed by segment_id
 */
export function generateAllBookingSuggestions(segments, currencyRate = 1, options = {}) {
    const bookableTypes = ['outbound_travel', 'return_travel', 'accommodation'];
    const bookableSegments = segments.filter(s => bookableTypes.includes(s.type));

    // Pass bookable count so upgrade pool can be split evenly
    const enrichedOptions = { ...options, _bookableCount: bookableSegments.length };

    const suggestionsMap = {};
    for (const seg of bookableSegments) {
        const suggestion = suggestBookingsForSegment(seg, currencyRate, enrichedOptions);
        suggestionsMap[suggestion.segment_id] = suggestion;
    }

    return suggestionsMap;
}
