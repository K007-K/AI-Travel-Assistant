// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') || '*'

// Dynamic CORS: allow production origin AND localhost for development
function getCorsHeaders(req: Request): Record<string, string> {
    const origin = req.headers.get('origin') || ''
    const allowedOrigins = [ALLOWED_ORIGIN, 'http://localhost:6006', 'http://localhost:5173', 'http://localhost:3000']
    const matchedOrigin = allowedOrigins.includes(origin) ? origin : ALLOWED_ORIGIN
    return {
        'Access-Control-Allow-Origin': matchedOrigin,
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    }
}

// ── Helpers ─────────────────────────────────────────────────────────

function sanitizeString(val: unknown, fallback = ''): string {
    if (typeof val !== 'string') return fallback
    return val.replace(/[\x00-\x1F\x7F]/g, '').trim().slice(0, 200)
}

function toNumber(val: unknown, fallback = 0): number {
    const n = Number(val)
    return isNaN(n) ? fallback : n
}

// ── Main handler ────────────────────────────────────────────────────

serve(async (req: Request) => {
    const corsHeaders = getCorsHeaders(req)
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // ── Auth check ──────────────────────────────────────
        const authHeader = req.headers.get('Authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // ── Validate API key ────────────────────────────────
        const groqApiKey = Deno.env.get('GROQ_API_KEY')
        if (!groqApiKey) {
            throw new Error('GROQ_API_KEY is not set')
        }

        // ── Parse & validate input ──────────────────────────
        const raw = await req.json()

        const destination = sanitizeString(raw.destination, 'Unknown')
        const days = Math.max(1, Math.floor(toNumber(raw.days, 1)))
        const travelers = Math.max(1, Math.floor(toNumber(raw.travelers, 1)))
        const budget = toNumber(raw.budget, 0)
        const currency = sanitizeString(raw.currency, 'USD').toUpperCase().slice(0, 3)
        const total_budget = toNumber(raw.total_budget) || budget
        const actual_spent = toNumber(raw.actual_spent)
        const ai_estimated_total = toNumber(raw.ai_estimated_total)
        const forecast_total = toNumber(raw.forecast_total)
        const forecast_percent = toNumber(raw.forecast_percent)
        const remaining_forecast = toNumber(raw.remaining_forecast)
        const category_breakdown = Array.isArray(raw.category_breakdown) ? raw.category_breakdown : []

        // ── Build prompts ───────────────────────────────────

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
No emotional language.`

        const userMessage = `Analyze the financial data for this trip:

Destination: ${destination}
Duration: ${days} days
Travelers: ${travelers}
Currency: ${currency}

Financial Summary:
- Total Budget: ${currency} ${total_budget}
- Actual Spent (Manual + Bookings): ${currency} ${actual_spent}
- AI Estimated Remaining Costs: ${currency} ${ai_estimated_total}
- Forecast Total: ${currency} ${forecast_total}
- Forecast Utilization: ${forecast_percent}%
- Remaining (Forecast): ${currency} ${remaining_forecast}

Category Breakdown:
${JSON.stringify(category_breakdown, null, 2)}

Provide your financial assessment as a JSON object.`

        // ── Call Groq API ───────────────────────────────────
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${groqApiKey}`,
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
        })

        const data = await response.json()

        if (!response.ok) {
            console.error('Groq API error:', data?.error)
            throw new Error(`Groq API Error: ${data?.error?.message || response.statusText}`)
        }

        // ── Parse and validate AI response ──────────────────
        const rawContent = data?.choices?.[0]?.message?.content

        if (!rawContent || typeof rawContent !== 'string') {
            throw new Error('Groq returned empty or malformed response')
        }

        let insights: any
        try {
            insights = JSON.parse(rawContent)
        } catch (_parseErr) {
            // If JSON parsing fails, wrap the raw text
            insights = {
                summary: rawContent.slice(0, 500) || "Analysis could not be parsed.",
                risk_analysis: "Unable to determine risk from AI response.",
                category_insights: [],
                recommendations: []
            }
        }

        // Enforce max limits
        if (Array.isArray(insights.recommendations) && insights.recommendations.length > 5) {
            insights.recommendations = insights.recommendations.slice(0, 5)
        }
        if (Array.isArray(insights.category_insights) && insights.category_insights.length > 5) {
            insights.category_insights = insights.category_insights.slice(0, 5)
        }

        return new Response(JSON.stringify({ insights }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        console.error('budget-validator error:', message)

        return new Response(JSON.stringify({
            error: 'Budget analysis failed',
            details: message,
            insights: {
                summary: 'Analysis failed due to a server error.',
                risk_analysis: "Unable to assess risk due to an error.",
                category_insights: [],
                recommendations: ["Please try again later or contact support."]
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
