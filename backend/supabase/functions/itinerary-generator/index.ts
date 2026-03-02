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

// ── Budget tier descriptions ────────────────────────────────────────

const BUDGET_TIER_DESCRIPTIONS: Record<string, string> = {
    'luxury': `LUXURY: Only premium options. 5-star hotels, fine dining, private tours, first-class transport.`,
    'mid-range': `MID-RANGE: Balance quality and value. 3-4 star hotels, popular restaurants, mix of paid and free activities.`,
    'budget': `BUDGET: Minimize costs. Hostels, street food, free activities, public transport, walking. At least 50% of activities should be FREE.`
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

        // Budget tier
        const rawTier = sanitizeString(rawBody.budgetTier).toLowerCase()
        const budgetTier = VALID_TIERS.includes(rawTier) ? rawTier : 'mid-range'
        const budgetGuidance = BUDGET_TIER_DESCRIPTIONS[budgetTier] || BUDGET_TIER_DESCRIPTIONS['mid-range']

        // Trip context
        const startLocation = sanitizeString(rawBody.startLocation) || 'unknown'
        const travelStyle = sanitizeString(rawBody.travelStyle) || 'explore'

        // Overnight context (from orchestrator's OSRM data)
        const isOvernightArrival = rawBody.isOvernightArrival === true
        const arrivalTime = sanitizeString(rawBody.arrivalTime) || null
        const arrivalMode = sanitizeString(rawBody.arrivalMode) || null
        const isOvernightDeparture = rawBody.isOvernightDeparture === true
        const departureTime = sanitizeString(rawBody.departureTime) || null
        const departureMode = sanitizeString(rawBody.departureMode) || null
        const hasAccommodation = rawBody.hasAccommodation === true
        const travelHours = toPositiveNumber(rawBody.travelHours, 0) || null

        // Multi-city schedule
        const tripDays: any[] = Array.isArray(rawBody.tripDays) ? rawBody.tripDays : []
        const scheduleInfo = tripDays.length > 0
            ? tripDays.filter((d: any) => d?.dayNumber && d?.location).map((d: any) => `Day ${d.dayNumber}: ${d.location}`).join(', ')
            : `Day 1: ${destination}`

        // Budget calculation
        const budgetPerPerson = travelers > 1 ? Math.round(budget / travelers) : budget
        const dailyPerPerson = Math.round(budgetPerPerson / Math.max(days, 1))

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

        // ── Dynamic time window ─────────────────────────────
        const dayStartTime = isOvernightArrival ? (arrivalTime || '06:00') : '08:00'
        const dayEndTime = isOvernightDeparture ? (departureTime || '21:00') : '21:00'

        // ── Build the prompt ────────────────────────────────
        const prompt = `
You are a professional travel operations planner. Generate a COMPLETE, LOGISTICALLY REALISTIC itinerary.
You must include EVERYTHING: intercity transport, local transport, activities, meals, and practical tips.

---------------------------------------------------
TRIP DETAILS:

Origin: ${startLocation}
Destination: ${destination}
Total Days at destination: ${days}
Travelers: ${travelers} ${travelers === 1 ? '(solo)' : '(group)'}
Total Budget: ${budgetPerPerson} ${currency} per person (${budget} ${currency} total for all travelers)
Daily budget: ~${dailyPerPerson} ${currency}/person/day
Budget Tier: ${budgetTier}
Travel Style: ${travelStyle}
Schedule: ${scheduleInfo}

---------------------------------------------------
TRANSPORT CONTEXT:

${isOvernightArrival
    ? `OVERNIGHT ARRIVAL: Traveler boards overnight ${arrivalMode || 'bus/train'} from ${startLocation} the previous night.
Arrives at ${destination} at approximately ${arrivalTime || '06:00'}.
The traveler needs to freshen up at the station/bus stand first.
Start planning activities from ${dayStartTime}, NOT 08:00.`
    : startLocation !== 'unknown' && startLocation.toLowerCase() !== destination.toLowerCase()
        ? `Traveler arrives from ${startLocation}. Include outbound transport as the first item.`
        : `Traveler is local to ${destination}. No intercity transport needed.`}

${isOvernightDeparture
    ? `OVERNIGHT DEPARTURE: Traveler boards overnight ${departureMode || 'bus/train'} back to ${startLocation} at ~${departureTime || '21:00'}.
Plan dinner 1-2 hours before departure. End last activity by ${parseInt(departureTime || '21') - 2}:00.`
    : startLocation !== 'unknown' && startLocation.toLowerCase() !== destination.toLowerCase()
        ? `Include return transport to ${startLocation} as the last item.`
        : ''}

${!hasAccommodation && isOvernightArrival ? `NO HOTEL: This is a day trip — traveler sleeps on overnight transport, no hotel needed.` : ''}
${travelHours ? `Estimated travel time: ${travelHours} hours one way.` : ''}

TRAIN COST REFERENCE (India): Use REALISTIC per-person fares based on budget tier:
- Budget: Sleeper class — ~₹1/km (e.g. 500km ≈ ₹400-600/person)
- Mid-range: 3AC — ~₹1.5-2/km (e.g. 500km ≈ ₹700-1000/person)
- Luxury: 2AC/1AC — ~₹2.5-4/km (e.g. 500km ≈ ₹1200-2000/person)
For BUS: AC Sleeper ~₹1-1.5/km, Non-AC ~₹0.7/km. For FLIGHTS: check typical fares for the route.

---------------------------------------------------
${budgetGuidance}

---------------------------------------------------
PLANNING RULES:

1. REAL PLACES ONLY — specific named temples, restaurants, landmarks. No generic "Local Market" or "Nearby Area".
2. NAMED RESTAURANTS with actual dish recommendations and per-person meal cost.
3. Include entry/darshan/ticket costs as estimated_cost for each activity.
4. For temples: mention free prasadam/langar if available (estimated_cost: 0). Note advance booking, dress codes, queue times.
5. Include local transport details between activities in the "notes" field with real costs (auto ₹XX, city bus ₹XX). ALSO provide a "local_transport_total" for each day summing ALL local transport costs for that day.
6. Account for queue times at popular spots (temples: 1-3 hours, monuments: 30 min).
7. Time activities realistically — include travel time between spots.
8. Activities MUST be in chronological time order.
9. Minimum 6 activities per full day (mix of sightseeing, food, culture).
10. Include at least 2 full meals (breakfast/lunch/dinner) as separate activities with real restaurant names.
11. LOCATION FIELD MUST be the ACTUAL place name with neighborhood — e.g. "Sri Venkateswara Temple, Tirumala Hill" NOT "Near Tirupati Railway Station". EACH activity MUST have its real location, not the same generic location for all.
12. TYPE FIELD must be exactly one of: sightseeing, food, culture, relax, activity. Do NOT use "logistics", "nature", "shopping", "nightlife".

${travelers === 1
    ? `SOLO TRAVELER: Suggest solo-friendly experiences. Include safety tips.`
    : `GROUP OF ${travelers}: Suggest group-friendly activities. Note group discounts where applicable.`}
All costs must be PER PERSON in ${currency}.

Daily time window: ${dayStartTime}–${dayEndTime}

${contextData ? `\nVERIFIED LOCAL DATA:\n${contextData}` : ''}

---------------------------------------------------
OUTPUT FORMAT (STRICT JSON — NO MARKDOWN, NO EXPLANATION):

{
  "outbound_transport": {
    "mode": "bus|train|flight|none",
    "title": "Descriptive title like '🌙 Overnight 🚌 Bus — ${startLocation} → ${destination}'",
    "cost_per_person": 500,
    "departure": "21:00",
    "arrival": "${dayStartTime}",
    "is_overnight": true,
    "notes": "Booking tips, what to carry, platform info"
  },
  "days": [
    {
      "dayNumber": 1,
      "activities": [
        {
          "title": "Specific Real Place Name",
          "time": "06:30",
          "location": "Place Name, Neighborhood/Area, ${destination}",
          "type": "sightseeing|food|culture|relax|activity",
          "estimated_cost": 0,
          "notes": "Practical tips: how to reach, what to expect, booking info, local transport cost"
        }
      ],
      "local_transport_total": 150
    }
  ],
  "return_transport": {
    "mode": "bus|train|flight|none",
    "title": "Descriptive title",
    "cost_per_person": 500,
    "departure": "${dayEndTime}",
    "arrival": "07:00",
    "is_overnight": true,
    "notes": "Booking tips"
  },
  "total_per_person": 2200,
  "important_notes": ["Book tickets in advance", "Carry ID proof"]
}

---------------------------------------------------
SELF-VALIDATION BEFORE RETURNING:

1. Activities are in chronological time order.
2. No time overlaps.
3. Total per-person cost (transport + activities + food) ≤ ${budgetPerPerson} ${currency}.
4. At least 6 activities per day (including meals and logistics).
5. At least 2 named meal activities per day.
6. ALL activities are in ${destination}, NOT in ${startLocation}.
7. outbound_transport and return_transport both have realistic costs.
8. All costs are per person in ${currency}.
9. If overnight arrival: first activity should be freshening up, day starts from arrival time.
10. If overnight departure: last activity is dinner, followed by travel to station.

RETURN ONLY THE JSON OBJECT. NO TEXT BEFORE OR AFTER.
`

        // ── Call Groq API ───────────────────────────────────
        const maxTokens = Math.min(8192, Math.max(4000, days * 2000))

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${groqApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    {
                        role: "system",
                        content: `You are an expert travel planner for ${destination} with deep knowledge of local attractions, restaurants, transport costs, temple practices, and cultural customs. You generate logistically realistic, time-sorted itineraries with real place names and accurate local prices in ${currency}. You always include practical details: how to reach each spot, queue times, dress codes, and booking tips. Output strict JSON only, never markdown or explanations.`
                    },
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
