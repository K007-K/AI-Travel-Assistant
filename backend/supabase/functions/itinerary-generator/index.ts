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
        const _pace = sanitizeString(rawBody.pace)
        const activityCountTarget = Math.max(2, Math.min(8, Math.floor(toPositiveNumber(rawBody.activityCountTarget, 5))))
        const excludeTransport = rawBody.excludeTransport === true
        const excludeAccommodation = rawBody.excludeAccommodation === true

        // Trip logistics context
        const startLocation = sanitizeString(rawBody.startLocation) || 'unknown'
        const hasOutboundTransport = rawBody.hasOutboundTransport === true
        const hasReturnTransport = rawBody.hasReturnTransport === true

        const budgetGuidance = BUDGET_TIER_DESCRIPTIONS[budgetTier] || BUDGET_TIER_DESCRIPTIONS['mid-range']

        // ── Schedule context (multi-city support) ───────────
        const formatItineraryStructure = (daysArray: any[]): string => {
            if (!daysArray || daysArray.length === 0) return ''
            return daysArray
                .filter((d: any) => d && d.dayNumber && d.location)
                .map((d: any) => `Day ${d.dayNumber}: ${d.location}`)
                .join(', ')
        }

        const scheduleInfo = tripDays && tripDays.length > 0
            ? formatItineraryStructure(tripDays)
            : `Day 1: ${destination}`

        // ── Style-based activity limits ─────────────────────
        const STYLE_LIMITS: Record<string, number> = {
            'relaxation': 3,
            'city_explorer': 4,
            'adventure': 5,
            'business': 2,
            'road_trip': 4,
        }
        const styleLimit = STYLE_LIMITS[travelStyle] || activityCountTarget || 4
        const styleName = travelStyle || 'explore'

        // ── RAG retrieval (optional, gracefully degrades) ───
        let contextData = ""
        try {
            const geminiKey = Deno.env.get('GEMINI_API_KEY')
            if (destination && geminiKey) {
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
                    }
                }
            }
        } catch (ragErr) {
            console.warn("RAG: Retrieval failed, proceeding without context.", ragErr)
        }

        // ── Build prompt ────────────────────────────────────
        const effectiveBudget = activityBudget || budget || 2000
        const dailyBudget = Math.round(effectiveBudget / Math.max(days, 1))
        const dailyPerPerson = travelers > 1 ? Math.round(dailyBudget / travelers) : dailyBudget

        // Budget tier guidance for pricing
        const budgetPriceGuide = budgetTier === 'budget'
            ? 'Budget → low-cost or free attractions only. At least 50% of activities should be FREE.'
            : budgetTier === 'luxury'
                ? 'Premium → high-end experiences allowed.'
                : 'Comfort → moderate priced attractions.'

        // Constraint block
        const transportConstraint = excludeTransport
            ? '\n- DO NOT include any transport segments (flights, trains, buses, taxis).'
            : ''
        const accommodationConstraint = excludeAccommodation
            ? '\n- DO NOT include accommodation or hotel suggestions.'
            : ''

        const prompt = `
You are a professional travel operations planner, not a creative writer.
You must generate a LOGISTICALLY REALISTIC itinerary.
You must obey ALL constraints strictly.

---------------------------------------------------
TRIP CONTEXT:

Origin: ${startLocation}
Destination: ${destination}
Travel Style: ${styleName}
Budget Tier: ${budgetTier}
Total Days: ${days}
Travelers: ${travelers} ${travelers === 1 ? '(solo)' : '(group)'}
Activity Budget: ${dailyPerPerson} ${currency}/person/day (${effectiveBudget} ${currency} total for ${travelers} travelers)
Schedule: ${scheduleInfo}

Arrival Info:
- Arrival transport exists: ${hasOutboundTransport}
- Arrival time: unknown

Departure Info:
- Return transport exists: ${hasReturnTransport}
- Departure time: unknown

Daily time window: 08:00–21:00
Max total activity time per day: 10 hours
Mandatory lunch buffer: 1 hour (12:00-13:00)
Mandatory 30-minute buffer between activities

---------------------------------------------------
STYLE RULES (HARD LIMITS):

${styleName} style → max ${styleLimit} activities per day.
You MUST NOT exceed this limit.

---------------------------------------------------
DISTANCE RULE:

All activities in the same day must be geographically close.
If distance between two activities exceeds 40 km,
DO NOT place them on the same day.
Group activities by proximity. Do NOT zigzag across the city.

---------------------------------------------------
ARRIVAL & DEPARTURE RULES:

${hasOutboundTransport ? `Traveler is arriving from ${startLocation}.
If intercity distance > 300km and trip is only 1 day, keep itinerary very light (max 2 activities).` : 'Traveler is local — full day available.'}

${hasReturnTransport ? 'Ensure last-day activities end early enough for return travel.' : ''}

---------------------------------------------------
BUDGET RULES:

${budgetPriceGuide}
${budgetGuidance}

Each activity must include realistic estimated_cost in ${currency}.
Use ACTUAL local prices, not inflated tourist prices.
Stay consistent with ${destination} pricing.
${transportConstraint}
${accommodationConstraint}

---------------------------------------------------
TRAVELER RULES:

${travelers === 1
  ? `Solo traveler — suggest individual-friendly experiences:
- Walking tours, café visits, solo-friendly temples, photography spots
- Avoid group-only tours or family packages
- Include safety tips for solo travelers`
  : `Group of ${travelers} travelers — suggest group-friendly activities:
- Guided tours, shared experiences, group-friendly restaurants
- Include group booking tips where applicable
- Consider group discounts`}

All activity costs must be PER PERSON, not group total.

---------------------------------------------------
QUALITY RULES:

1. SPECIFIC REAL PLACES ONLY — no generic fillers like "Evening Walk" or "Local Market"
2. NAMED restaurants/stalls with actual dish recommendations
3. PRACTICAL TIPS in "notes": booking requirements, dress codes, timings, local transport
4. CULTURAL CONTEXT: temple etiquette, local customs, safety warnings where relevant

${contextData ? `\nVERIFIED LOCAL DATA:\n${contextData}` : ''}

---------------------------------------------------
OUTPUT FORMAT (STRICT JSON ONLY):

{
  "days": [
    {
      "dayNumber": 1,
      "activities": [
        {
          "title": "Specific Place Name",
          "time": "09:00",
          "location": "Exact area/landmark in ${destination}",
          "type": "sightseeing|food|culture|nature|shopping|nightlife",
          "estimated_cost": 100,  // <-- PER PERSON cost in ${currency}
          "safety_warning": "Warning text or null",
          "notes": "Practical logistical notes: booking tips, dress code, best timing"
        }
      ]
    }
  ]
}

---------------------------------------------------
CRITICAL SELF-VALIDATION (do this internally before returning):

1. Activity count does NOT exceed ${styleLimit} per day.
2. No time overlaps between activities.
3. Total daily active time ≤ 10 hours.
4. Activities are geographically logical (no 40km+ jumps).
5. ALL activities are in ${destination}, NOT in ${startLocation}.
6. Per-person daily activity cost ≤ ${dailyPerPerson} ${currency}.

If any rule is violated, FIX it before returning.
DO NOT explain anything. RETURN JSON ONLY.
`

        // ── Call Groq API ───────────────────────────────────
        // Dynamic max_tokens: ~1500 tokens per day for detailed schedules, capped at 8192
        const maxTokens = Math.min(8192, Math.max(3500, days * 1500))

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${groqApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: "system", content: `You are a professional travel operations planner for ${destination}. You output logistically realistic itineraries with real place names, accurate local prices in ${currency}, and practical tips. You strictly follow all time, distance, and budget constraints. Output strict JSON only, never markdown or explanations.` },
                    { role: "user", content: prompt }
                ],
                temperature: 0.6,
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
