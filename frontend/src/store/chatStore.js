import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { routeMessage } from '../engine/intentRouter';
import { makeGroqRequest } from '../api/groq';
import useItineraryStore from './itineraryStore';

// ── Build context from itineraryStore for intent routing ─────────────
function _getContext() {
    const itStore = useItineraryStore.getState();
    const trip = itStore.trips.find(t => t.id === itStore.currentTrip) || itStore.trips[0];

    return {
        allocation: itStore.allocation || null,
        reconciliation: itStore.reconciliation || null,
        dailySummary: itStore.dailySummary || [],
        destination: trip?.destination || '',
        currentLocation: trip?.destination || '',
        currency: trip?.currency || 'USD',
        travelStyle: trip?.travel_style || '',
        budgetTier: trip?.accommodation_preference || 'mid-range',
        tripName: trip?.name || '',
        travelers: trip?.travelers || 1,
    };
}

// ── Unified Chat Store ───────────────────────────────────────────────
// Serves both the Chat page and the AI Companion panel.
// Uses intent routing for deterministic queries, falls back to AI.

const WELCOME_MESSAGE = {
    id: 'welcome',
    role: 'assistant',
    content: 'Hello! I\'m your TravelAI assistant. 👋\n\nI can help you plan trips, find hidden gems, or give you cultural tips for any destination.\n\nWhere are you thinking of going?',
    timestamp: Date.now(),
};

const useChatStore = create(
    persist(
        (set, _get) => ({
            messages: [WELCOME_MESSAGE],
            isLoading: false,
            error: null,

            // Companion panel UI state
            isOpen: false,
            toggleOpen: () => set(state => ({ isOpen: !state.isOpen })),
            setOpen: (open) => set({ isOpen: open }),

            // Unified send — intent routing first, AI fallback second
            sendMessage: async (text) => {
                if (!text?.trim()) return;

                const userMessage = {
                    id: Date.now().toString(),
                    role: 'user',
                    content: text.trim(),
                    timestamp: Date.now(),
                };

                set(state => ({
                    messages: [...state.messages, userMessage],
                    isLoading: true,
                    error: null,
                }));

                try {
                    const context = _getContext();
                    const { intent, confidence, response } = routeMessage(text, context);

                    let responseContent = response.text;

                    // If handler signals AI fallback needed, call Groq
                    if (response.needsAI) {
                        const systemPrompt = response.systemPrompt ||
                            'You are a helpful AI travel assistant. Keep responses concise and travel-focused.';
                        responseContent = await makeGroqRequest([
                            { role: 'system', content: systemPrompt },
                            { role: 'user', content: text },
                        ]);
                    }

                    const assistantMessage = {
                        id: (Date.now() + 1).toString(),
                        role: 'assistant',
                        content: responseContent,
                        intent,
                        confidence,
                        type: response.type,
                        data: response.data,
                        timestamp: Date.now(),
                    };

                    set(state => ({
                        messages: [...state.messages, assistantMessage],
                        isLoading: false,
                    }));
                } catch (error) {
                    console.error('[Chat] Error processing message:', error);
                    const errorText = error.message || 'Something went wrong. Please try again.';
                    set(state => ({
                        messages: [...state.messages, {
                            id: (Date.now() + 1).toString(),
                            role: 'assistant',
                            content: `❌ ${errorText}`,
                            intent: 'error',
                            type: 'error',
                            timestamp: Date.now(),
                        }],
                        isLoading: false,
                        error: errorText,
                    }));
                }
            },

            clearChat: () => set({ messages: [WELCOME_MESSAGE] }),

            // Alias for companion backward compat
            clearMessages: () => set({ messages: [WELCOME_MESSAGE] }),
        }),
        {
            name: 'travel-chat-storage',
            partialize: (state) => ({ messages: state.messages }),
            merge: (persistedState, currentState) => ({
                ...currentState,
                ...persistedState,
                isLoading: false,
                error: null,
            }),
        }
    )
);

export default useChatStore;
