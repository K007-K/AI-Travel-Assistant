import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') || '*'

function getCorsHeaders(req: Request): Record<string, string> {
    const origin = req.headers.get('origin') || ''
    const allowedOrigins = [ALLOWED_ORIGIN, 'http://localhost:6006', 'http://localhost:5173', 'http://localhost:3000']
    const matchedOrigin = allowedOrigins.includes(origin) ? origin : ALLOWED_ORIGIN
    return {
        'Access-Control-Allow-Origin': matchedOrigin,
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    }
}

serve(async (req: Request) => {
    const corsHeaders = getCorsHeaders(req)
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { q, limit = 8, format = 'json' } = await req.json()

        if (!q || typeof q !== 'string') {
            return new Response(JSON.stringify({ error: 'Missing query parameter "q"' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        const params = new URLSearchParams({
            format,
            q,
            limit: String(limit),
            addressdetails: '1',
            extratags: '1',
        })

        const nominatimRes = await fetch(
            `https://nominatim.openstreetmap.org/search?${params}`,
            {
                headers: {
                    'User-Agent': 'RoameoTravelApp/1.0 (contact@roameo.app)',
                    'Accept': 'application/json',
                },
            }
        )

        if (!nominatimRes.ok) {
            return new Response(JSON.stringify({ error: `Nominatim error: ${nominatimRes.status}` }), {
                status: nominatimRes.status,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        const data = await nominatimRes.json()

        return new Response(JSON.stringify(data), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    } catch (error) {
        return new Response(JSON.stringify({ error: (error as Error).message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
