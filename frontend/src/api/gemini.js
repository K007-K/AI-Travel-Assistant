import { GoogleGenerativeAI } from "@google/generative-ai";
import { logger } from '../utils/logger';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

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
        if (!API_KEY) {
            throw new Error("Gemini API Key is missing");
        }

        const genAI = new GoogleGenerativeAI(API_KEY);
        // Using gemini-pro as it's the stable model for v1beta
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        // Build the conversation history (excluding the last user message)
        // IMPORTANT: Filter out the initial welcome message and ensure history starts with user
        const history = messages
            .slice(0, -1)  // Exclude the last message (current user input)
            .filter(msg => msg.id !== 'welcome')  // Remove welcome message
            .map(msg => ({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }]
            }));

        const chat = model.startChat({
            history: history,
            generationConfig: {
                maxOutputTokens: 2048,
                temperature: 0.7,
            },
        });

        const lastMessage = messages[messages.length - 1].content;

        // Add system prompt to first user message only (when history is empty)
        const messageToSend = history.length === 0
            ? `${SYSTEM_PROMPT}\n\nUser: ${lastMessage}`
            : lastMessage;

        const result = await chat.sendMessage(messageToSend);
        const response = await result.response;
        return response.text();

    } catch (error) {
        logger.error("Gemini API Error:", error);

        if (error.message.includes('429')) {
            return "I'm receiving too many requests right now. Please give me a moment to catch my breath! 😅";
        }

        if (error.message.includes('API_KEY_INVALID') || error.message.includes('API key')) {
            return "❌ Invalid API Key. Please check your .env file.";
        }

        if (error.message.includes('404') || error.message.includes('not found')) {
            return "❌ Model configuration error. Please try again later.";
        }

        return "I'm having trouble connecting to my travel database right now. Please check your internet connection or try again in a moment.";
    }
};
