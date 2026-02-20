import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') || '*'

const corsHeaders: Record<string, string> = {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Valid OpenRouteService travel profiles
const VALID_PROFILES = [
    'driving-car', 'driving-hgv',
    'cycling-regular', 'cycling-road', 'cycling-mountain', 'cycling-electric',
    'foot-walking', 'foot-hiking', 'wheelchair'
]

function isValidCoord(coord: unknown): boolean {
    if (!coord || typeof coord !== 'object') return false
    const c = coord as Record<string, unknown>
    return typeof c.lat === 'number' && typeof c.lng === 'number'
        && c.lat >= -90 && c.lat <= 90
        && c.lng >= -180 && c.lng <= 180
        && isFinite(c.lat) && isFinite(c.lng)
}

serve(async (req: Request) => {
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

        // ── Parse & validate input ──────────────────────────
        const body = await req.json()
        const { from, to, profile } = body

        if (!isValidCoord(from)) {
            return new Response(JSON.stringify({ error: 'Invalid "from" — must have lat (-90..90) and lng (-180..180)' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            })
        }

        if (!isValidCoord(to)) {
            return new Response(JSON.stringify({ error: 'Invalid "to" — must have lat (-90..90) and lng (-180..180)' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            })
        }

        if (!profile || typeof profile !== 'string' || !VALID_PROFILES.includes(profile)) {
            return new Response(JSON.stringify({
                error: `Invalid profile. Must be one of: ${VALID_PROFILES.join(', ')}`
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            })
        }

        // ── Validate API key ────────────────────────────────
        const orsApiKey = Deno.env.get('ORS_API_KEY')
        if (!orsApiKey) {
            return new Response(JSON.stringify({ error: 'Route service unavailable' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 503,
            })
        }

        // ── Call OpenRouteService ────────────────────────────
        const orsRes = await fetch(`https://api.openrouteservice.org/v2/directions/${profile}`, {
            method: 'POST',
            headers: {
                'Authorization': orsApiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                coordinates: [[from.lng, from.lat], [to.lng, to.lat]],
                format: 'geojson',
            }),
        })

        if (!orsRes.ok) {
            const errText = await orsRes.text().catch(() => 'unknown')
            console.error(`ORS API error: ${orsRes.status} — ${errText.slice(0, 200)}`)
            return new Response(JSON.stringify({ error: 'Route service error' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: orsRes.status,
            })
        }

        const data = await orsRes.json()

        return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        console.error('Route proxy error:', message)
        return new Response(JSON.stringify({ error: 'Internal server error', details: message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        })
    }
})
