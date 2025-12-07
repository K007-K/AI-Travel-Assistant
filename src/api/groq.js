const API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const API_URL = "https://api.groq.com/openai/v1/chat/completions";

// Reusing the same robust system prompt
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

const makeGroqRequest = async (messages, jsonMode = false) => {
    try {
        if (!API_KEY) {
            throw new Error("Groq API Key is missing. Please check your .env file.");
        }

        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: messages,
                temperature: 0.7,
                max_tokens: 4096, // Increased for itineraries
                response_format: jsonMode ? { type: "json_object" } : undefined
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("Groq API Error Response:", errorData);
            throw new Error(`Groq API Error: ${response.status} ${response.statusText} - ${errorData.error?.message || ''}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error("Groq API Execution Error:", error);
        throw error;
    }
};

export const sendMessageToGroq = async (messages) => {
    try {
        // Format messages for Groq
        const apiMessages = [
            { role: "system", content: SYSTEM_PROMPT },
            ...messages.map(msg => ({
                role: msg.role === 'assistant' ? 'assistant' : 'user',
                content: msg.content
            }))
        ];

        return await makeGroqRequest(apiMessages);

    } catch (error) {
        if (error.message.includes('401') || error.message.includes('Key')) {
            return "❌ Invalid Groq API Key. Please check your .env file.";
        }

        if (error.message.includes('429')) {
            return "I'm receiving too many requests. Please try again in a moment services are busy.";
        }

        return "I'm having trouble connecting to my travel database via Groq. Please check your connection.";
    }
};

// Helper to format days info (e.g. "Day 1-2: Paris, Day 3-5: London")
const formatItineraryStructure = (daysArray) => {
    if (!daysArray || daysArray.length === 0) return '';
    return daysArray.map(d => `Day ${d.dayNumber}: ${d.location}`).join(', ');
};

export const generateTripPlan = async (destination, days, budget, travelers, currency = 'USD', tripDays = [], budgetTier = 'mid-range') => {
    // Budget tier descriptions with explicit constraints
    const budgetTierDescriptions = {
        'luxury': `
        ===== LUXURY TIER REQUIREMENTS =====
        YOU MUST RECOMMEND ONLY PREMIUM/LUXURY OPTIONS. DO NOT suggest budget or mid-range alternatives.
        
        ACCOMMODATION: Only 5-star hotels, luxury resorts, or boutique hotels (e.g., Ritz-Carlton, Four Seasons, Aman)
        DINING: Fine dining restaurants, Michelin-starred venues, celebrity chef restaurants, upscale rooftop bars
        - Breakfast: $30-50 per person at hotel restaurant or premium cafe
        - Lunch: $40-80 per person at upscale restaurant
        - Dinner: $100-200+ per person at fine dining establishment
        
        TRANSPORTATION: Private chauffeur, luxury car service, first-class train, private helicopter/boat tours
        - NO public transportation, NO walking tours, NO budget options
        
        ACTIVITIES: VIP experiences, private guided tours, exclusive access, premium spa treatments, yacht cruises
        - Entry fees: Expect to pay premium prices ($50-200+ per activity)
        - Example: Private sunset yacht cruise ($500), helicopter tour ($400), VIP museum tour ($150)
        
        STYLE: Emphasize exclusivity, privacy, personalized service, and premium comfort`,

        'mid-range': `
        ===== MID-RANGE TIER REQUIREMENTS =====
        Balance quality and value. Mix popular attractions with some splurge experiences.
        
        ACCOMMODATION: 3-4 star hotels, well-reviewed boutique hotels, quality guesthouses
        DINING: Popular local restaurants, well-reviewed cafes, mix of local and international cuisine
        - Breakfast: $10-20 per person
        - Lunch: $15-30 per person at decent restaurant
        - Dinner: $25-50 per person
        
        TRANSPORTATION: Combination of public transport (metro, buses), taxis for convenience, some rideshares
        
        ACTIVITIES: Mix of paid popular attractions and free experiences, guided group tours
        - Entry fees: Standard pricing ($15-40 per attraction)
        - Example: City bus tour ($30), guided museum tour ($25), cooking class ($60)
        
        STYLE: Good quality while being cost-conscious, authentic local experiences`,

        'budget': `
        ===== BUDGET TIER REQUIREMENTS =====
        YOU MUST PRIORITIZE FREE OR LOW-COST OPTIONS. Do NOT suggest luxury or expensive alternatives.
        
        ACCOMMODATION: Hostels, budget hotels ($20-50/night), guesthouses
        DINING: Street food, local markets, affordable eateries, self-catering when possible
        - Breakfast: $3-8 per person (street vendors, bakeries)
        - Lunch: $5-12 per person (local eateries, food courts)
        - Dinner: $8-15 per person (local restaurants, street food)
        
        TRANSPORTATION: Public buses, metro, walking, bicycles
        - NO taxis unless absolutely necessary
        - NO private tours or car services
        
        ACTIVITIES: Free walking tours, public parks, free museums (or free days), markets, beaches, hiking
        - Prioritize FREE activities
        - Paid activities should be under $20
        - Example: Free walking tour (tip-based $5), public beach (free), city viewpoint (free)
        
        STYLE: Authentic local experiences, backpacker-friendly, maximize experiences while minimizing costs`
    };

    const budgetGuidance = budgetTierDescriptions[budgetTier] || budgetTierDescriptions['mid-range'];

    // Construct a specific schedule if multi-city data exists
    const scheduleContext = tripDays.length > 0
        ? `\n    ITINERARY SCHEDULE:\n    ${formatItineraryStructure(tripDays)}\n    Generate activities SPECIFIC to the location mentioned for each day.`
        : `\n    Trip to: ${destination}`;

    const prompt = `
    Generate a comprehensive, fully detailed ${days}-day itinerary for ${travelers} travelers.
    Total budget: ${budget} ${currency}.
    ${scheduleContext}

    ${budgetGuidance}

    ⚠️ ABSOLUTE REQUIREMENT: Your recommendations MUST strictly adhere to the ${budgetTier.toUpperCase()} tier guidelines above.
    
    NEGATIVE CONSTRAINTS (WHAT TO AVOID):
    ${budgetTier === 'luxury' ? '- ABSOLUTELY NO hostels, guesthouses, or 3-star hotels.\n    - NO street food or cheap eats for main meals.\n    - NO public transport (unless it is a luxury train/experience).\n    - NO free/cheap walking tours. SUGGEST PRIVATE/VIP TOURS ONLY.' : ''}
    ${budgetTier === 'budget' ? '- NO luxury hotels or resorts.\n    - NO fine dining or expensive restaurants.\n    - NO private tours or taxis (unless necessary/shared).\n    - AVOID paid attractions if a free alternative exists.' : ''}
    
    SAFETY & ALERTS (CRITICAL):
    For EACH activity, you MUST assess potential dangers (e.g., "Strong currents - No swimming", "High theft area", "Steep hike").
    If a specific location has known risks (like Rushikonda Beach having swimming restrictions), YOU MUST INCLUDE IT in the 'safety_warning' field.
    If no major danger, set 'safety_warning' to null.
    
    CRITICAL: You must provide a FULL day's schedule for EVERY day. 
    Each day MUST include at least 5-6 activities covering Morning, Afternoon, and Evening.
    Do NOT leave any day empty.
    
    PRICING: Include realistic estimated costs in ${currency} for EVERY activity, meal, and transportation.
    Make sure costs align with the ${budgetTier} tier price ranges specified above.
    
    Return ONLY valid JSON in the following format:
    {
      "days": [
        {
          "dayNumber": 1,
          "activities": [
            {
              "title": "Activity Name",
              "time": "09:00",
              "location": "Specific location name",
              "type": "sightseeing",
              "safety_warning": "Warning text or null",
              "notes": "Detailed description. Cost: [amount]"
            }
          ]
        }
      ]
    }
    
    Ensure locations are real and precise for the specific city of that day.
    Remember: The quality and type of recommendations must clearly reflect the ${budgetTier.toUpperCase()} tier.
    `;

    try {
        const jsonResponse = await makeGroqRequest([
            { role: "system", content: "You are a travel API that outputs strict JSON." },
            { role: "user", content: prompt }
        ], true);

        return JSON.parse(jsonResponse);
    } catch (error) {
        console.error("Failed to generate trip plan:", error);
        throw new Error("Failed to generate itinerary. Please try again.");
    }
};

export const getHiddenGems = async (destination) => {
    const prompt = `
    Suggest 5 "hidden gem" activities or unique spots in ${destination} that most tourists miss.
    
    Return ONLY valid JSON in the following format:
    {
      "gems": [
        {
          "title": "Spot Name",
          "description": "Why it's unique"
        }
      ]
    }
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
    Translate the following text from ${sourceLang} to ${targetLang}:
    "${text}"

    Return ONLY the translated text. Do not include quotes, explanations, or any other text.
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
