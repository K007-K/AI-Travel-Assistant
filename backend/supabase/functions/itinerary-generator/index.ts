import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY')

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const RequestData = await req.json()
        const { destination, days, budget, travelers, currency, tripDays, budgetTier } = RequestData

        if (!GROQ_API_KEY) {
            throw new Error('GROQ_API_KEY is not set')
        }

        // --- LOGIC MOVED FROM FRONTEND FOR SECURITY ---
        // Budget descriptions hardcoded on SERVER SIDE to prevent tamper
        const budgetTierDescriptions = {
            'luxury': `
        ===== LUXURY TIER REQUIREMENTS =====
        YOU MUST RECOMMEND ONLY PREMIUM/LUXURY OPTIONS. DO NOT suggest budget or mid-range alternatives.
        ACCOMMODATION: Only 5-star hotels, luxury resorts, or boutique hotels.
        DINING: Fine dining, Michelin-starred, upscale rooftop bars.
        TRANSPORTATION: Private chauffeur, luxury car service, first-class train.
        ACTIVITIES: VIP experiences, private tours, yacht cruises.
        STYLE: Exclusivity, privacy, personalized service.`,

            'mid-range': `
        ===== MID-RANGE TIER REQUIREMENTS =====
        Balance quality and value.
        ACCOMMODATION: 3-4 star hotels, boutique hotels.
        DINING: Popular local restaurants, cafes.
        TRANSPORTATION: Public transport + taxis.
        ACTIVITIES: Paid attractions + free experiences.
        STYLE: Good quality, authentic local experiences.`,

            'budget': `
        ===== BUDGET TIER REQUIREMENTS =====
        YOU MUST PRIORITIZE FREE OR LOW-COST OPTIONS.
        ACCOMMODATION: Hostels, budget hotels.
        DINING: Street food, local markets.
        TRANSPORTATION: Public buses, walking.
        ACTIVITIES: Free walking tours, parks, beaches.
        STYLE: Backpacker-friendly, minimize costs.`
        };

        const tierKey = budgetTier || 'mid-range';
        const budgetGuidance = budgetTierDescriptions[tierKey] || budgetTierDescriptions['mid-range'];

        const formatItineraryStructure = (daysArray) => {
            if (!daysArray || daysArray.length === 0) return '';
            return daysArray.map((d: any) => `Day ${d.dayNumber}: ${d.location}`).join(', ');
        };

        const scheduleContext = tripDays && tripDays.length > 0
            ? `\n    ITINERARY SCHEDULE:\n    ${formatItineraryStructure(tripDays)}\n    Generate activities SPECIFIC to the location mentioned for each day.`
            : `\n    Trip to: ${destination}`;

        // --- RAG RETRIEVAL START ---
        let contextData = "";
        try {
            if (destination) {
                const geminiKey = Deno.env.get('GEMINI_API_KEY');
                if (geminiKey) {
                    // 1. Generate Embedding for Destination
                    const embedRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedContent?key=${geminiKey}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            model: "models/embedding-001",
                            content: { parts: [{ text: destination }] }
                        })
                    });

                    if (embedRes.ok) {
                        const embedData = await embedRes.json();
                        const embedding = embedData.embedding.values;

                        // 2. Query Vector DB
                        const supabase = createClient(
                            Deno.env.get('SUPABASE_URL') ?? '',
                            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
                        );

                        const { data: documents } = await supabase.rpc('match_documents', {
                            query_embedding: embedding,
                            match_threshold: 0.5,
                            match_count: 3
                        });

                        if (documents && documents.length > 0) {
                            contextData = documents.map(doc => doc.content).join("\n\n");
                            console.log(`RAG: Found ${documents.length} relevant docs.`);
                        }
                    } else {
                        console.warn("RAG: Gemini Embedding failed (Rate Limit?)");
                    }
                }
            }
        } catch (err) {
            console.warn("RAG: Retrieval failed, proceeding without context.", err);
        }
        // --- RAG RETRIEVAL END ---

        const prompt = `
    Generate a comprehensive, fully detailed ${days}-day itinerary for ${travelers} travelers.
    Total budget: ${budget} ${currency}.
    ${scheduleContext}

    ${budgetGuidance}

    REAL-WORLD CONTEXT (Use this to ground your detailed recommendations):
    ${contextData || "No specific verified data found in knowledge base. Rely on general knowledge."}

    ⚠️ ABSOLUTE REQUIREMENT: Your recommendations MUST strictly adhere to the ${tierKey.toUpperCase()} tier guidelines above.
    
    CRITICAL: You must provide a FULL day's schedule for EVERY day. 
    Each day MUST include at least 5-6 activities covering Morning, Afternoon, and Evening.
    
    PRICING: Include realistic estimated costs in ${currency} for EVERY activity.
    
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
    `;

        // Call Groq API
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: "system", content: "You are a travel API that outputs strict JSON." },
                    { role: "user", content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 4096,
                response_format: { type: "json_object" }
            }),
        })

        const data = await response.json()

        if (!response.ok) {
            throw new Error(data.error?.message || 'Failed to fetch from Groq')
        }

        return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        })
    }
})
