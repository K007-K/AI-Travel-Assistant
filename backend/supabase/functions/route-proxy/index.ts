import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') || '*'
const ORS_API_KEY = Deno.env.get('ORS_API_KEY')

const corsHeaders = {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { from, to, profile } = await req.json()

        if (!from || !to || !profile) {
            return new Response(JSON.stringify({ error: 'Missing required fields: from, to, profile' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            })
        }

        if (!ORS_API_KEY) {
            return new Response(JSON.stringify({ error: 'Route service unavailable' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 503,
            })
        }

        const orsRes = await fetch(`https://api.openrouteservice.org/v2/directions/${profile}`, {
            method: 'POST',
            headers: {
                'Authorization': ORS_API_KEY,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                coordinates: [[from.lng, from.lat], [to.lng, to.lat]],
                format: 'geojson',
            }),
        })

        if (!orsRes.ok) {
            console.error(`ORS API error: ${orsRes.status}`)
            return new Response(JSON.stringify({ error: 'Route service error' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: orsRes.status,
            })
        }

        const data = await orsRes.json()

        return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    } catch (error) {
        console.error('Route proxy error:', error)
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        })
    }
})
