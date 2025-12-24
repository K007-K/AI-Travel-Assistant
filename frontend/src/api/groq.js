import { supabase } from '../lib/supabase';

// Helper for generic chat completion via Edge Function
export const makeGroqRequest = async (messages, jsonMode = false) => {
    try {
        const { data, error } = await supabase.functions.invoke('chat-completion', {
            body: { messages }
        });

        if (error) {
            console.error("Msg Edge Function Error:", error);
            throw new Error(error.message || "Failed to connect to AI service");
        }

        // Output format from Edge Function is expected to be OpenAI-compatible
        return data.choices[0].message.content;
    } catch (error) {
        console.error("Groq API Execution Error:", error);
        throw error;
    }
};

export const sendMessageToGroq = async (messages) => {
    try {
        // We still construct the input messages here, but the System Prompt
        // could ideally be moved to the backend too. For now, we pass it.
        const SYSTEM_PROMPT = `
You are TravelAI, an expert, friendly, and enthusiastic travel assistant. 
Your goal is to help users plan perfect trips, discover hidden gems, and get practical travel advice.

Tone: Professional yet warm, encouraging, practical.
Format: Use Markdown.
`;
        const apiMessages = [
            { role: "system", content: SYSTEM_PROMPT },
            ...messages.map(msg => ({
                role: msg.role === 'assistant' ? 'assistant' : 'user',
                content: msg.content
            }))
        ];

        return await makeGroqRequest(apiMessages);

    } catch (error) {
        console.error("Chat Error:", error);
        return "I'm having trouble connecting to my travel database via the secure server. Please check your connection.";
    }
};

export const generateTripPlan = async (destination, days, budget, travelers, currency = 'USD', tripDays = [], budgetTier = 'mid-range') => {
    try {
        // Securely invoke the itinerary-generator function
        // The Prompt construction and System Prompt are now hidden on the server
        const { data, error } = await supabase.functions.invoke('itinerary-generator', {
            body: {
                destination,
                days,
                budget,
                travelers,
                currency,
                tripDays,
                budgetTier
            }
        });

        if (error) {
            console.error("Itinerary Edge Function Error:", error);
            throw new Error(error.message || "Failed to generate itinerary");
        }

        // The function returns the parsed JSON directly from Groq's json_object response
        // data.choices[0].message.content is a STRING containing JSON.
        // We need to parse it if the Edge function returns the raw OpenAI response structure.
        // My Edge function returns JSON.stringify(data), which is the full response object.
        const content = data.choices[0].message.content;
        return JSON.parse(content);

    } catch (error) {
        console.error("Failed to generate trip plan:", error);
        throw new Error("Failed to generate itinerary. Please try again.");
    }
};

export const getHiddenGems = async (destination) => {
    const prompt = `
    Suggest 5 "hidden gem" activities or unique spots in ${destination} that most tourists miss.
    Return ONLY valid JSON in the following format:
    { "gems": [ { "title": "Spot Name", "description": "Why it's unique" } ] }
    `;

    try {
        const jsonResponse = await makeGroqRequest([
            { role: "system", content: "You are a travel API that outputs strict JSON." },
            { role: "user", content: prompt }
        ], true);

        return JSON.parse(jsonResponse).gems;
    } catch (error) {
        console.error("Failed to get hidden gems:", error);
        return [];
    }
};

export const translateText = async (text, sourceLang, targetLang) => {
    const prompt = `
    Translate the following text from ${sourceLang} to ${targetLang}: "${text}"
    Return ONLY the translated text.
    `;

    try {
        const response = await makeGroqRequest([
            { role: "system", content: "You are a professional translator. Output only the translated text." },
            { role: "user", content: prompt }
        ]);
        return response.trim();
    } catch (error) {
        console.error("Translation failed:", error);
        throw new Error("Translation failed");
    }
};

export const validateTripBudget = async (tripDetails) => {
    try {
        const { data, error } = await supabase.functions.invoke('budget-validator', {
            body: {
                destination: tripDetails.destination,
                days: tripDetails.days,
                travelers: tripDetails.travelers,
                budget: tripDetails.budget,
                currency: tripDetails.currency
            }
        });

        if (error) throw new Error(error.message);

        // Check for "soft error" returned as 200 OK from the function
        if (data.error) {
            throw new Error(data.error);
        }

        return data; // Returns { report: "Markdown String" }
    } catch (error) {
        console.error("Budget Validation Error:", error);
        return {
            report: `### ❌ Analysis Error\n\n**Reason:** ${error.message || "Unknown error occurred"}\n\n**Action:** Please check if the \`GROQ_API_KEY\` is set in your Supabase Secrets.`
        };
    }
};

