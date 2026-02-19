import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';

// System prompt to guide the AI's behavior
const SYSTEM_PROMPT = `
You are TravelAI, an expert, friendly, and enthusiastic travel assistant. 
Your goal is to help users plan perfect trips, discover hidden gems, and get practical travel advice.

Key Responsibilities:
1.  **Itinerary Planning:** Create detailed, day-by-day itineraries based on user preferences.
2.  **Budgeting:** Estimate costs and suggest budget-friendly options.
3.  **Local Insights:** Share cultural tips, local customs, and hidden spots not found in standard guides.
4.  **Safety:** Provide safety advice and emergency contacts for destinations.
5.  **Translation:** Help with basic phrases if asked.

Tone:
- Professional yet warm and personal.
- Encouraging and exciting (use emojis!).
- Practical and detailed.

Format:
- Use Markdown for formatting (bold, lists, headers).
- Structure itineraries clearly (Day 1, Morning/Afternoon/Evening).
- When suggesting places, try to mention why they are special.
`;

export const sendMessageToGemini = async (messages) => {
    try {
        // Build conversation history for the edge function
        const apiMessages = [
            { role: 'system', content: SYSTEM_PROMPT },
            ...messages
                .filter(msg => msg.id !== 'welcome')
                .map(msg => ({
                    role: msg.role === 'user' ? 'user' : 'assistant',
                    content: msg.content
                }))
        ];

        const { data, error } = await supabase.functions.invoke('chat-completion', {
            body: { messages: apiMessages }
        });

        if (error) {
            throw new Error(error.message || 'Edge function error');
        }

        return data.choices?.[0]?.message?.content || "I couldn't generate a response.";

    } catch (error) {
        logger.error("AI Chat Error:", error);

        if (error.message?.includes('429')) {
            return "I'm receiving too many requests right now. Please give me a moment to catch my breath! 😅";
        }

        return "I'm having trouble connecting to my travel database right now. Please check your internet connection or try again in a moment.";
    }
};
