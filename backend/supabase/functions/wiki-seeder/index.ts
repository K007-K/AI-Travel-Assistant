// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') || '*'

const corsHeaders: Record<string, string> = {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

        // ── Validate input ──────────────────────────────────
        const body = await req.json()
        const rawCity = body?.city

        if (!rawCity || typeof rawCity !== 'string' || rawCity.trim().length === 0) {
            return new Response(JSON.stringify({ error: 'city is required and must be a non-empty string' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // Sanitize city name
        const city = rawCity.replace(/[\x00-\x1F\x7F]/g, '').trim().slice(0, 100)

        // ── Validate env vars ───────────────────────────────
        const geminiKey = Deno.env.get('GEMINI_API_KEY')
        if (!geminiKey) {
            throw new Error('GEMINI_API_KEY is not set in Edge Function secrets.')
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL')
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
        if (!supabaseUrl || !supabaseServiceKey) {
            throw new Error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set.')
        }

        // ── 1. Fetch Wikipedia Summary ──────────────────────
        const wikiRes = await fetch(
            `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(city)}`
        )

        if (!wikiRes.ok) {
            throw new Error(`Wikipedia API returned status ${wikiRes.status} for "${city}"`)
        }

        const wikiData = await wikiRes.json()

        if (!wikiData || !wikiData.extract) {
            throw new Error(`Wikipedia returned no extract content for "${city}"`)
        }

        // Clean text: title + extract
        const title = wikiData.title || city
        const content = `City: ${title}. ${wikiData.extract}`

        // ── 2. Generate Embedding via Gemini ────────────────
        const embedRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedContent?key=${geminiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: "models/embedding-001",
                    content: { parts: [{ text: content }] }
                })
            }
        )

        if (!embedRes.ok) {
            const errBody = await embedRes.text().catch(() => 'unknown')
            throw new Error(`Gemini Embedding API returned status ${embedRes.status}: ${errBody.slice(0, 200)}`)
        }

        const embedData = await embedRes.json()

        if (embedData.error) {
            throw new Error(`Gemini Error: ${embedData.error.message || JSON.stringify(embedData.error)}`)
        }

        const embedding = embedData?.embedding?.values
        if (!embedding || !Array.isArray(embedding) || embedding.length === 0) {
            throw new Error('Gemini returned unexpected embedding format — missing embedding.values array')
        }

        // ── 3. Store in Supabase ────────────────────────────
        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // Safely build metadata — wikiData.content_urls may not exist for all page types
        const metadata: Record<string, string> = {
            source: 'wikipedia',
            city: city,
            title: title,
        }
        if (wikiData?.content_urls?.desktop?.page) {
            metadata.url = wikiData.content_urls.desktop.page
        }

        const { error: dbError } = await supabase
            .from('knowledge_base')
            .insert({
                content: content,
                embedding: embedding,
                metadata: metadata,
                verification_level: 'verified_source'
            })

        if (dbError) {
            throw new Error(`Database insert failed: ${dbError.message}`)
        }

        return new Response(JSON.stringify({
            success: true,
            city: city,
            title: title,
            content_length: content.length,
            embedding_dimensions: embedding.length,
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        console.error('wiki-seeder error:', message)
        return new Response(JSON.stringify({ error: 'Wiki seeding failed', details: message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        })
    }
})
