import { serve } from "https://deno.land/std@0.168.0/http/server.ts";


const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') || '*';

const corsHeaders = {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const {
            destination,
            days,
            travelers,
            budget,
            currency,
            // Structured financial data from RPC
            total_budget,
            actual_spent,
            ai_estimated_total,
            forecast_total,
            forecast_percent,
            remaining_forecast,
            category_breakdown
        } = await req.json();

        const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');
        if (!GROQ_API_KEY) {
            throw new Error('GROQ_API_KEY is not set');
        }

        const systemPrompt = `You are a Financial Travel Budget Analyst.

Your role is to analyze structured financial data for a trip and produce
a professional, data-grounded financial assessment.

You must operate under strict rules:

--------------------------------------------------
DATA RULES
--------------------------------------------------

- You must ONLY use numerical values provided in the input.
- You must NOT invent or estimate missing numbers.
- You must NOT modify or suggest changes to itinerary content.
- You must NOT introduce tourist attractions or hidden gems.
- You must NOT hallucinate costs or percentages.
- You must NOT compute totals — assume all calculations are pre-computed.

--------------------------------------------------
BEHAVIOR RULES
--------------------------------------------------

- Focus strictly on financial health.
- Distinguish between actual spend and projected (AI estimated) spend.
- Interpret risk level from provided forecast_percent.
- Provide clear, structured analysis.
- Keep output under 200 words.
- Provide maximum 5 recommendations.

--------------------------------------------------
RISK INTERPRETATION GUIDE
--------------------------------------------------

If forecast_percent < 60:
    Risk = LOW

If 60 <= forecast_percent < 80:
    Risk = MODERATE

If 80 <= forecast_percent < 100:
    Risk = HIGH

If forecast_percent >= 100:
    Risk = CRITICAL

--------------------------------------------------
OUTPUT FORMAT (MANDATORY JSON)
--------------------------------------------------

You MUST respond with ONLY a valid JSON object. No markdown, no code fences, no explanation outside the JSON.

{
  "summary": "Short financial overview.",
  "risk_analysis": "Clear statement about sustainability of forecast.",
  "category_insights": [
    "Insight 1",
    "Insight 2"
  ],
  "recommendations": [
    "Recommendation 1",
    "Recommendation 2"
  ]
}

--------------------------------------------------
TONE
--------------------------------------------------

Professional.
Analytical.
Concise.
Financially grounded.
No hype.
No emotional language.`;

        const userMessage = `Analyze the financial data for this trip:

Destination: ${destination}
Duration: ${days} days
Travelers: ${travelers}
Currency: ${currency}

Financial Summary:
- Total Budget: ${currency} ${total_budget || budget}
- Actual Spent (Manual + Bookings): ${currency} ${actual_spent || 0}
- AI Estimated Remaining Costs: ${currency} ${ai_estimated_total || 0}
- Forecast Total: ${currency} ${forecast_total || 0}
- Forecast Utilization: ${forecast_percent || 0}%
- Remaining (Forecast): ${currency} ${remaining_forecast || 0}

Category Breakdown:
${JSON.stringify(category_breakdown || [], null, 2)}

Provide your financial assessment as a JSON object.`;

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userMessage }
                ],
                temperature: 0.1,
                response_format: { type: "json_object" },
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(`Groq API Error: ${data.error?.message || response.statusText}`);
        }

        const rawContent = data.choices[0]?.message?.content;

        // Parse the JSON response from the AI
        let insights;
        try {
            insights = JSON.parse(rawContent);
        } catch (_parseErr) {
            // If JSON parsing fails, wrap the raw text
            insights = {
                summary: rawContent || "Analysis could not be parsed.",
                risk_analysis: "Unable to determine risk from AI response.",
                category_insights: [],
                recommendations: []
            };
        }

        // Ensure max 5 recommendations
        if (insights.recommendations && insights.recommendations.length > 5) {
            insights.recommendations = insights.recommendations.slice(0, 5);
        }
        if (insights.category_insights && insights.category_insights.length > 5) {
            insights.category_insights = insights.category_insights.slice(0, 5);
        }

        return new Response(JSON.stringify({ insights }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('budget-validator error:', error);
        return new Response(JSON.stringify({
            error: 'Budget analysis failed',
            insights: {
                summary: 'Analysis failed due to a server error.',
                risk_analysis: "Unable to assess risk due to an error.",
                category_insights: [],
                recommendations: ["Please try again later or contact support."]
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
