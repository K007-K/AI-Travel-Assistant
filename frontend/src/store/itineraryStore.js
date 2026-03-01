/**
 * Itinerary Store — Orchestration lifecycle for trip generation.
 *
 * Owns: generateFullItinerary, orchestration phase state, budget allocation/reconciliation.
 * Reads trip data from tripStore (cross-store access via getState).
 * Does NOT own: trip CRUD or segment operations (that's tripStore).
 */
import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import CURRENCY_MULTIPLIERS from '../data/currencyRates.json';
import { orchestrateTrip } from '../engine/tripOrchestrator';
import { generateAllBookingSuggestions } from '../engine/bookingSuggestionEngine';
import { getHiddenGems, validateTripBudget } from '../api/groq';
import { buildDaysFromSegments } from '../utils/itineraryHelpers';
import useTripStore from './tripStore';

const useItineraryStore = create((set, _get) => ({
    // ── Orchestration Lifecycle State ─────────────────────────────────
    allocation: null,          // Budget allocation from Phase 1
    reconciliation: null,      // Budget reconciliation from Phase 10
    dailySummary: [],          // Per-day cost breakdown from Phase 8
    bookingOptions: {},        // Booking suggestions keyed by segment_id (Phase 7)
    hiddenGems: [],            // Isolated hidden gems (Phase 9)
    orchestrationPhase: null,  // Current phase name for progress UI

    // ── Full Lifecycle Generation (Orchestrator) ─────────────────────
    generateFullItinerary: async (tripId) => {
        // Read trip from tripStore
        const tripStore = useTripStore.getState();
        const trip = tripStore.trips.find(t => t.id === tripId);
        if (!trip) throw new Error('Trip not found');

        // Reset orchestration state
        set({
            allocation: null,
            dailySummary: [],
            bookingOptions: {},
            hiddenGems: [],
            orchestrationPhase: 'Starting',
        });

        // Run the 10-phase orchestrator
        const result = await orchestrateTrip(trip, {
            onPhase: (num, name) => {
                set({ orchestrationPhase: `Phase ${num}: ${name}` });
            },
        });

        // Clear all existing segments for this trip
        await supabase
            .from('trip_segments')
            .delete()
            .eq('trip_id', tripId);

        // Bulk-insert ALL segments from orchestrator
        const dbSegments = result.segments.map(({ latitude, longitude, ...rest }) => {
            if (latitude != null || longitude != null) {
                rest.metadata = { ...rest.metadata, latitude, longitude };
            }
            return rest;
        });
        const { data: inserted, error } = await supabase
            .from('trip_segments')
            .insert(dbSegments)
            .select();

        if (error) {
            console.error('Error inserting orchestrated segments:', error);
            set({ orchestrationPhase: null });
            throw error;
        }

        // Rebuild virtual days from inserted segments
        const rebuiltDays = buildDaysFromSegments(inserted || [], trip);

        // Generate booking suggestions post-insert using real DB UUIDs
        const currency = trip.currency || 'USD';
        const currencyRate = CURRENCY_MULTIPLIERS[currency] || 1;
        const isLuxury = (trip.accommodation_preference || 'mid-range') === 'luxury';
        const upgradePool = result.allocation?.upgrade_pool || 0;

        const bookingOptions = generateAllBookingSuggestions(
            inserted || [],
            currencyRate,
            { isLuxury, upgradePool }
        );

        // Update tripStore with rebuilt days
        useTripStore.setState(state => ({
            trips: state.trips.map(t =>
                t.id === tripId ? { ...t, days: rebuiltDays, _hasSegments: true } : t
            ),
        }));

        // Update orchestration state
        set({
            allocation: result.allocation,
            reconciliation: result.reconciliation,
            dailySummary: result.daily_summary,
            bookingOptions: bookingOptions,
            hiddenGems: result.hidden_gems,
            orchestrationPhase: null,
        });

        return { ...result, booking_options: bookingOptions };
    },

    // ── Layer Gateway: AI & Budget Functions ──────────────────────────
    validateBudget: async (tripParams, budgetSummary) => {
        return validateTripBudget(tripParams, budgetSummary);
    },

    fetchHiddenGems: async (destination, options = {}) => {
        return getHiddenGems(destination, options);
    },
}));

export default useItineraryStore;
