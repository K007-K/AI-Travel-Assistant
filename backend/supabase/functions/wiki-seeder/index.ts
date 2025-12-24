import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { city } = await req.json()
        if (!city) throw new Error('City is required')

        // 1. Fetch Wikipedia Summary
        const wikiRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(city)}`)
        if (!wikiRes.ok) throw new Error(`Wiki API Error: ${wikiRes.statusText}`)
        const wikiData = await wikiRes.json()

        // Clean text: title + extract
        const content = `City: ${wikiData.title}. ${wikiData.extract}`

        // 2. Generate Embedding (Gemini)
        const geminiKey = Deno.env.get('GEMINI_API_KEY')
        const embedRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedContent?key=${geminiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: "models/embedding-001",
                content: { parts: [{ text: content }] }
            })
        })

        const embedData = await embedRes.json()
        if (embedData.error) throw new Error(`Gemini Error: ${embedData.error.message}`)

        const embedding = embedData.embedding.values // Array of 768 floats

        // 3. Store in Supabase
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { error: dbError } = await supabase
            .from('knowledge_base')
            .insert({
                content: content,
                embedding: embedding,
                metadata: {
                    source: 'wikipedia',
                    url: wikiData.content_urls.desktop.page,
                    city: city,
                    title: wikiData.title
                },
                verification_level: 'verified_source'
            })

        if (dbError) throw new Error(`DB Error: ${dbError.message}`)

        return new Response(JSON.stringify({ success: true, city, content_length: content.length }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        })
    }
})
