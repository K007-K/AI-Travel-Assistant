// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

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

// ── Validation helpers ──────────────────────────────────────────────

const VALID_TIERS = ['luxury', 'mid-range', 'budget']

function sanitizeString(val: unknown, maxLen = 200): string {
    if (typeof val !== 'string') return ''
    return val.replace(/[\x00-\x1F\x7F]/g, '').trim().slice(0, maxLen)
}

function toPositiveNumber(val: unknown, fallback: number): number {
    const n = Number(val)
    return isNaN(n) || n < 0 ? fallback : n
}

// ── Budget tier descriptions (hardcoded server-side to prevent tamper) ──

const BUDGET_TIER_DESCRIPTIONS: Record<string, string> = {
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
            throw new Error('GROQ_API_KEY is not set in Edge Function secrets.')
        }

        // ── Parse & validate input ──────────────────────────
        const rawBody = await req.json()

        const destination = sanitizeString(rawBody.destination)
        if (!destination) {
            return new Response(JSON.stringify({ error: 'destination is required' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        const days = Math.max(1, Math.min(30, Math.floor(toPositiveNumber(rawBody.days, 1))))
        const budget = toPositiveNumber(rawBody.budget, 2000)
        const travelers = Math.max(1, Math.min(20, Math.floor(toPositiveNumber(rawBody.travelers, 1))))
        const currency = sanitizeString(rawBody.currency, 5).toUpperCase() || 'USD'
        const tripDays: any[] = Array.isArray(rawBody.tripDays) ? rawBody.tripDays : []

        // Validate & normalize budget tier
        const rawTier = sanitizeString(rawBody.budgetTier).toLowerCase()
        const budgetTier = VALID_TIERS.includes(rawTier) ? rawTier : 'mid-range'

        // Lifecycle fields from orchestrator
        const activityBudget = toPositiveNumber(rawBody.activityBudget, 0) || null
        const travelStyle = sanitizeString(rawBody.travelStyle)
        const pace = sanitizeString(rawBody.pace)
        const activityCountTarget = Math.max(2, Math.min(8, Math.floor(toPositiveNumber(rawBody.activityCountTarget, 5))))
        const excludeTransport = rawBody.excludeTransport === true
        const excludeAccommodation = rawBody.excludeAccommodation === true

        const budgetGuidance = BUDGET_TIER_DESCRIPTIONS[budgetTier] || BUDGET_TIER_DESCRIPTIONS['mid-range']

        // ── Schedule context (multi-city support) ───────────
        const formatItineraryStructure = (daysArray: any[]): string => {
            if (!daysArray || daysArray.length === 0) return ''
            return daysArray
                .filter((d: any) => d && d.dayNumber && d.location)
                .map((d: any) => `Day ${d.dayNumber}: ${d.location}`)
                .join(', ')
        }

        const scheduleContext = tripDays && tripDays.length > 0
            ? `\n    ITINERARY SCHEDULE:\n    ${formatItineraryStructure(tripDays)}\n    Generate activities SPECIFIC to the location mentioned for each day.`
            : `\n    Trip to: ${destination}`

        // ── RAG retrieval (optional, gracefully degrades) ───
        let contextData = ""
        try {
            const geminiKey = Deno.env.get('GEMINI_API_KEY')
            if (destination && geminiKey) {
                // 1. Generate embedding via Gemini API
                const embedRes = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedContent?key=${geminiKey}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            model: "models/embedding-001",
                            content: { parts: [{ text: destination }] }
                        })
                    }
                )

                if (embedRes.ok) {
                    const embedData = await embedRes.json()
                    const embedding = embedData?.embedding?.values

                    if (embedding && Array.isArray(embedding)) {
                        // 2. Query vector DB for relevant destination docs
                        const supabaseUrl = Deno.env.get('SUPABASE_URL')
                        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

                        if (supabaseUrl && supabaseKey) {
                            const supabase = createClient(supabaseUrl, supabaseKey)

                            const { data: documents } = await supabase.rpc('match_documents', {
                                query_embedding: embedding,
                                match_threshold: 0.5,
                                match_count: 3
                            })

                            if (documents && Array.isArray(documents) && documents.length > 0) {
                                contextData = documents
                                    .filter((doc: any) => doc && doc.content)
                                    .map((doc: any) => doc.content)
                                    .join("\n\n")
                                console.log(`RAG: Found ${documents.length} relevant docs.`)
                            }
                        }
                    } else {
                        console.warn("RAG: Gemini returned unexpected embedding format.")
                    }
                } else {
                    console.warn(`RAG: Gemini Embedding failed with status ${embedRes.status}.`)
                }
            }
        } catch (ragErr) {
            console.warn("RAG: Retrieval failed, proceeding without context.", ragErr)
        }

        // ── Build prompt ────────────────────────────────────
        const effectiveBudget = activityBudget || budget || 2000
        const dailyBudget = Math.round(effectiveBudget / Math.max(days, 1))
        const effectivePace = pace || 'moderate'

        // Per-activity cost caps by tier
        const tierCostCaps: Record<string, { max: number; typical: number }> = {
            'budget': { max: Math.round(dailyBudget * 0.25), typical: Math.round(dailyBudget * 0.10) },
            'mid-range': { max: Math.round(dailyBudget * 0.35), typical: Math.round(dailyBudget * 0.15) },
            'luxury': { max: Math.round(dailyBudget * 0.50), typical: Math.round(dailyBudget * 0.25) },
        }
        const caps = tierCostCaps[budgetTier] || tierCostCaps['mid-range']

        // Constraint block: tell AI what NOT to generate
        const constraintBlock = (excludeTransport || excludeAccommodation) ? `
    GENERATION CONSTRAINTS:
    ${excludeTransport ? '- DO NOT include any transport segments (flights, trains, buses, taxis, local transport).' : ''}
    ${excludeAccommodation ? '- DO NOT include any accommodation or hotel suggestions.' : ''}
    - Return ONLY activities (sightseeing, dining, experiences, tours).
    - Transport and accommodation are handled separately by the orchestration engine.
    ` : ''

        // Travel style hints
        const styleHint = travelStyle === 'road_trip'
            ? '\n    ROAD TRIP MODE: Include scenic stops, roadside attractions, and driving-friendly activities.'
            : travelStyle
                ? `\n    TRAVEL STYLE: "${travelStyle}" — tailor activities accordingly.`
                : ''

        // Pace constraints
        const paceHint = effectivePace === 'relaxed'
            ? '\n    PACE: Relaxed — max 4 activities per day with generous breaks.'
            : effectivePace === 'packed'
                ? '\n    PACE: Packed — include 6-8 activities per day for maximum coverage.'
                : '\n    PACE: Moderate — 5-6 activities per day with reasonable breaks.'

        const prompt = `
    Generate a comprehensive, fully detailed ${days}-day itinerary for ${travelers} traveler(s).
    ACTIVITY BUDGET ONLY: ${effectiveBudget} ${currency} total for all days.
    Daily activity budget: ~${dailyBudget} ${currency}/day.
    ${scheduleContext}

    ${budgetGuidance}

    ═══════════════════════════════════════════════════════════════
    🚨 BUDGET TIER IS THE #1 PRIORITY CONSTRAINT 🚨
    The "${budgetTier.toUpperCase()}" tier OVERRIDES all other considerations.
    Even if the budget allows more expensive options, you MUST recommend
    ${budgetTier.toUpperCase()}-appropriate options ONLY.
    
    PER-ACTIVITY COST RULES:
    - NO single activity should cost more than ${caps.max} ${currency}.
    - MOST activities should cost around ${caps.typical} ${currency} or less.
    ${budgetTier === 'budget' ? `- At least 50% of activities should be FREE (estimated_cost: 0).
    - Prefer: free walking tours, public parks, beaches, markets, street food.
    - AVOID: paid museums over ${caps.typical} ${currency}, fancy restaurants, private tours.` : ''}
    ═══════════════════════════════════════════════════════════════

    ACTIVITY COUNT: Generate exactly ${activityCountTarget} activities per day.
    This is a ${travelStyle || 'balanced'}-style trip — pace the activities accordingly.
    ${constraintBlock}
    ${styleHint}
    ${paceHint}

    REAL-WORLD CONTEXT (Use this to ground your detailed recommendations):
    ${contextData || "No specific verified data found in knowledge base. Rely on general knowledge."}

    CRITICAL BUDGET RULE: The sum of ALL estimated_cost values across ALL days MUST NOT EXCEED ${effectiveBudget} ${currency}.
    Each day's total should be approximately ${dailyBudget} ${currency}.
    
    CRITICAL: You must provide a FULL day's schedule for EVERY day. 
    Each day MUST include at least 5-6 activities covering Morning, Afternoon, and Evening.
    
    PRICING: Include realistic estimated costs in ${currency} for EVERY activity as a NUMBER in the "estimated_cost" field.
    
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
              "estimated_cost": 500,
              "safety_warning": "Warning text or null",
              "notes": "Detailed description including what to expect"
            }
          ]
        }
      ]
    }
    `

        // ── Call Groq API ───────────────────────────────────
        // Dynamic max_tokens: ~800 tokens per day, capped at 8192
        const maxTokens = Math.min(8192, Math.max(2048, days * 800))

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${groqApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: "system", content: "You are a travel API that outputs strict JSON. Never include markdown, code fences, or explanation outside the JSON object." },
                    { role: "user", content: prompt }
                ],
                temperature: 0.7,
                max_tokens: maxTokens,
                response_format: { type: "json_object" }
            }),
        })

        const data = await response.json()

        if (!response.ok) {
            console.error('Groq API error:', data?.error)
            throw new Error(data?.error?.message || `Groq API returned status ${response.status}`)
        }

        // ── Validate Groq response structure ────────────────
        const content = data?.choices?.[0]?.message?.content
        if (!content || typeof content !== 'string') {
            console.error('Groq returned empty or malformed response:', JSON.stringify(data).slice(0, 500))
            throw new Error('Groq returned empty or malformed response')
        }

        // Verify it parses as valid JSON before sending to client
        try {
            JSON.parse(content)
        } catch (_jsonErr) {
            console.error('Groq returned invalid JSON:', content.slice(0, 500))
            throw new Error('Groq returned non-parseable JSON response')
        }

        return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        console.error('itinerary-generator error:', message)

        return new Response(JSON.stringify({
            error: 'Itinerary generation failed',
            details: message,
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        })
    }
})
