import { serve } from "https://deno.land/std@0.168.0/http/server.ts";


const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { destination, days, travelers, budget, currency } = await req.json();

        // Initialize Supabase Client for DB operations
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY') ?? '';
        // Create client with simple fetch auth if needed, or stick to REST if imports fail.
        // For Deno Edge Functions, standard import is best.
        // We will do a direct REST call if client import is tricky, but let's try standard import first.
        // Actually, budget-validator already had imports removed. 
        // Let's use direct `fetch` to Supabase REST API to avoid import hell again.

        const DB_URL = `${supabaseUrl}/rest/v1/budget_cache`;
        const AUTH_HEADER = {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
        };

        // 1. Check Cache
        const cacheQuery = new URLSearchParams({
            destination: `eq.${destination}`,
            days: `eq.${days}`,
            travelers: `eq.${travelers}`,
            budget: `eq.${budget}`,
            currency: `eq.${currency}`,
            select: 'report'
        });

        const cacheRes = await fetch(`${DB_URL}?${cacheQuery.toString()}`, { headers: AUTH_HEADER });
        if (cacheRes.ok) {
            const cacheData = await cacheRes.json();
            if (cacheData.length > 0) {
                console.log("Cache Hit!");
                return new Response(JSON.stringify({ report: cacheData[0].report }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }
        }

        const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');
        if (!GROQ_API_KEY) {
            throw new Error('GROQ_API_KEY is not set');
        }

        const systemPrompt = `You are a savvy, friendly, and expert Travel Budget Consultant.
Your goal is to provide a clear, helpful, and "human" analysis of the user's travel budget.

CONTEXT:
- Destination: ${destination}
- Duration: ${days} days
- Travelers: ${travelers} people
- Budget (Per Person): ${budget} ${currency}

YOUR ANALYSIS STYLE:
1.  **Friendly & Direct:** Start with a warm, personalized opening.
2.  **Visual:** Use emojis to make sections pop.
3.  **Honest:** If the budget is low, say it gently but clearly. If it's great, cheer them on!
4.  **Structured:** Use clear headings (#, ##, ###) that map to the frontend design.

STRICT OUTPUT FORMAT (Markdown):

# 📊 Trip Budget Breakdown for ${destination}

### 💰 Your Budget Snapshot
*   **Budget per person:** ${currency} ${budget}
*   **Total for ${travelers} traveler(s):** **${currency} ${budget * travelers}**
*   **Status:** [✅ SUFFICIENT / ⚠️ TIGHT / ❌ INSUFFICIENT]

### 📝 Estimated Costs (Per Person)
*   **Accommodations (${days - 1} nights):** ${currency} [Cost]
*   **Food & Dining:** ${currency} [Cost]
*   **Transports:** ${currency} [Cost]
*   **Activities:** ${currency} [Cost]
*   **Buffer:** ${currency} [Cost]

**👉 Estimated Total:** **${currency} [Total]**

### 💡 AI Verdict & Tips
[Write a warm, human paragraph here. Explain clearly WHY the budget works or doesn't. Give 1-2 specific actionable money-saving tips for ${destination} if the budget is tight, or suggestion for a splurge if the budget is high.]

### 🌟 Hidden Gems to Visit
*   [Gem 1]
*   [Gem 2]
`;

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile', // Updated to match chat-completion
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `Analyze budget for a trip to ${destination} for ${days} days for ${travelers} people with a budget of ${budget} ${currency} per person.` }
                ],
                temperature: 0.1,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(`Groq API Error: ${data.error?.message || response.statusText}`);
        }

        const result = data.choices[0]?.message?.content;

        // 2. Save to Cache asynchronously (don't block response)
        // We use a promise without await to let it run in background, 
        // but Edge Functions might kill it early. Ideally we await it or use `EdgeRuntime.waitUntil`.
        // For safety in this environment, we will await it but with a short timeout or just await it fast.
        try {
            await fetch(DB_URL, {
                method: 'POST',
                headers: AUTH_HEADER,
                body: JSON.stringify({
                    destination,
                    days,
                    travelers,
                    budget,
                    currency,
                    report: result
                })
            });
        } catch (cacheErr) {
            console.error("Cache Insert Failed:", cacheErr);
        }

        return new Response(JSON.stringify({ report: result }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        // Return 200 even on error to bypass Supabase SDK generic error throwing
        // ensuring the UI sees the actual error message.
        return new Response(JSON.stringify({ error: error.message }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
