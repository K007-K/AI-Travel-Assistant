/**
 * Companion Store — Chat state + context injection for AI Companion
 *
 * Reads trip context from itineraryStore and injects it into each handler call.
 * Manages chat message history and processing state.
 */

import { create } from 'zustand';
import { routeMessage } from '../engine/intentRouter';
import useItineraryStore from './itineraryStore';

// ── Groq API fallback ────────────────────────────────────────────────
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

async function callGroq(message, systemPrompt) {
    if (!GROQ_API_KEY) {
        return "AI assistant unavailable — Groq API key not configured. I can still help with budget queries, emergency contacts, and activity planning using your trip data!";
    }

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'mixtral-8x7b-32768',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: message },
                ],
                max_tokens: 500,
                temperature: 0.7,
            }),
        });

        if (!response.ok) throw new Error(`Groq API error: ${response.status}`);
        const data = await response.json();
        return data.choices?.[0]?.message?.content || "I couldn't generate a response. Try asking about your budget or activities!";
    } catch (error) {
        console.error('[Companion] Groq API error:', error);
        return "Sorry, I couldn't reach the AI service. I can still help with budget queries, emergency contacts, and activity planning!";
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

    // Build context from itineraryStore
    _getContext: () => {
        const itStore = useItineraryStore.getState();
        const trip = itStore.trips.find(t => t.id === itStore.currentTrip) || itStore.trips[0];

        return {
            allocation: itStore.allocation,
            reconciliation: itStore.reconciliation,
            dailySummary: itStore.dailySummary,
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
