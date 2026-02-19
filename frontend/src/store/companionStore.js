import { create } from 'zustand';
import { routeMessage } from '../engine/intentRouter';
import useItineraryStore from './itineraryStore';
import { supabase } from '../lib/supabase';

// ── AI fallback via Edge Function (no client-side API key) ───────────
async function callGroq(message, systemPrompt) {
    try {
        const { data, error } = await supabase.functions.invoke('chat-completion', {
            body: {
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: message },
                ]
            }
        });

        if (error) throw error;
        return data.choices?.[0]?.message?.content || "I couldn't generate a response. Try asking about your budget or activities!";
    } catch (error) {
        console.error('[Companion] Edge function error:', error);
        return "Sorry, I couldn't reach the AI service. I can still help with budget queries, emergency contacts, and activity planning!";
    }
}

/**
 * Re-derive allocation + reconciliation from trip data.
 * Delegates to itineraryStore gateway to avoid duplicating budget logic.
 */
function deriveFromTrip(trip) {
    if (!trip || !trip._hasSegments || !trip.budget) return { allocation: null, reconciliation: null };

    try {
        const store = useItineraryStore.getState();
        const allocation = store.deriveAllocation(trip);

        // Flatten segments from days
        const allActivities = trip.days?.flatMap(d => d.activities || []) || [];
        const flatSegments = allActivities.map(a => ({
            type: a.segmentType || 'activity',
            estimated_cost: a.estimated_cost || 0,
        }));

        // Deduct used from remaining
        const categoryMap = {
            intercity: ['outbound_travel', 'return_travel', 'intercity_travel'],
            accommodation: ['accommodation'],
            local_transport: ['local_transport'],
            activity: ['activity', 'gem'],
        };
        for (const [cat, types] of Object.entries(categoryMap)) {
            const used = flatSegments
                .filter(s => types.includes(s.type))
                .reduce((sum, s) => sum + (parseFloat(s.estimated_cost) || 0), 0);
            if (allocation[`${cat}_remaining`] !== undefined) {
                allocation[`${cat}_remaining`] = Math.max(0, allocation[cat] - Math.round(used));
            }
        }

        const reconciliation = store.deriveReconciliation(allocation, flatSegments);
        return { allocation, reconciliation };
    } catch (err) {
        console.error('[Companion] Error deriving budget:', err);
        return { allocation: null, reconciliation: null };
    }
}

// ── Store ────────────────────────────────────────────────────────────

const useCompanionStore = create((set, get) => ({
    messages: [],
    isProcessing: false,
    isOpen: false,

    // Toggle companion panel
    toggleOpen: () => set(state => ({ isOpen: !state.isOpen })),
    setOpen: (open) => set({ isOpen: open }),

    // Build context from itineraryStore — re-derives budget if needed
    _getContext: () => {
        const itStore = useItineraryStore.getState();
        const trip = itStore.trips.find(t => t.id === itStore.currentTrip) || itStore.trips[0];

        // Use store allocation if available (freshly generated), otherwise re-derive from trip
        let allocation = itStore.allocation;
        let reconciliation = itStore.reconciliation;

        if (!allocation && trip) {
            const derived = deriveFromTrip(trip);
            allocation = derived.allocation;
            reconciliation = derived.reconciliation;
        }

        return {
            allocation,
            reconciliation,
            dailySummary: itStore.dailySummary || [],
            destination: trip?.destination || '',
            currentLocation: trip?.destination || '',
            currency: trip?.currency || 'USD',
            travelStyle: trip?.travel_style || '',
            budgetTier: trip?.accommodation_preference || 'mid-range',
            tripName: trip?.name || '',
            travelers: trip?.travelers || 1,
        };
    },

    // Send a message and get a response
    sendMessage: async (text) => {
        if (!text.trim()) return;

        const userMessage = {
            id: Date.now(),
            role: 'user',
            text: text.trim(),
            timestamp: new Date().toISOString(),
        };

        set(state => ({
            messages: [...state.messages, userMessage],
            isProcessing: true,
        }));

        try {
            const context = get()._getContext();
            const { intent, confidence, response } = routeMessage(text, context);

            let responseText = response.text;

            // If handler signals AI fallback needed
            if (response.needsAI) {
                responseText = await callGroq(text, response.systemPrompt);
            }

            const assistantMessage = {
                id: Date.now() + 1,
                role: 'assistant',
                text: responseText,
                intent,
                confidence,
                type: response.type,
                data: response.data,
                timestamp: new Date().toISOString(),
            };

            set(state => ({
                messages: [...state.messages, assistantMessage],
                isProcessing: false,
            }));
        } catch (error) {
            console.error('[Companion] Error processing message:', error);
            set(state => ({
                messages: [...state.messages, {
                    id: Date.now() + 1,
                    role: 'assistant',
                    text: 'Sorry, something went wrong. Try asking about your budget or type "emergency" for help.',
                    intent: 'error',
                    type: 'error',
                    timestamp: new Date().toISOString(),
                }],
                isProcessing: false,
            }));
        }
    },

    // Clear chat history
    clearMessages: () => set({ messages: [] }),
}));

export default useCompanionStore;
