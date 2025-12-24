import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { sendMessageToGroq } from '../api/groq';

const useChatStore = create(
    persist(
        (set, get) => ({
            messages: [
                {
                    id: 'welcome',
                    role: 'assistant',
                    content: 'Hello! I\'m your TravelAI assistant. 👋\n\nI can help you plan trips, find hidden gems, or give you cultural tips for any destination.\n\nWhere are you thinking of going?',
                    timestamp: Date.now(),
                },
            ],
            isLoading: false,
            error: null,

            addMessage: (message) => set((state) => ({
                messages: [...state.messages, { ...message, id: Date.now().toString(), timestamp: Date.now() }]
            })),

            sendMessage: async (content) => {
                const { messages, addMessage } = get();

                // Add user message
                addMessage({ role: 'user', content });

                set({ isLoading: true, error: null });

                try {
                    // Get AI response
                    const updatedMessages = [...get().messages];
                    // Filter out the welcome message for the API call to keep context clean if needed
                    // But Groq/Llama handles context well, let's just pass the user/assistant history
                    // We exclude the first 'welcome' message if it has a special ID to avoid "System" confusion if mapped incorrectly
                    // But our map in groq.js handles roles correctly.

                    const responseText = await sendMessageToGroq(updatedMessages);

                    addMessage({ role: 'assistant', content: responseText });
                } catch (error) {
                    console.error("Chat Store Error:", error);
                    const errorMessage = error.message || 'Something went wrong. Please try again.';
                    set({ error: errorMessage });
                    addMessage({ role: 'assistant', content: `❌ ${errorMessage}` });
                } finally {
                    set({ isLoading: false });
                }
            },

            clearChat: () => set({
                messages: [{
                    id: 'welcome',
                    role: 'assistant',
                    content: 'Hello! I\'m your TravelAI assistant. 👋\n\nI can help you plan trips, find hidden gems, or give you cultural tips for any destination.\n\nWhere are you thinking of going?',
                    timestamp: Date.now(),
                }]
            }),
        }),
        {
            name: 'travel-chat-storage',
            partialize: (state) => ({ messages: state.messages }), // Only persist messages
            merge: (persistedState, currentState) => ({
                ...currentState,
                ...persistedState,
                isLoading: false, // FORCE reset loading state on reload
                error: null,      // FORCE reset error state on reload
            }),
        }
    )
);

export default useChatStore;
