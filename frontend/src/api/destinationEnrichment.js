/**
 * Destination Enrichment Service
 *
 * Uses Groq AI (via Edge Function) to generate rich destination data
 * for non-curated destinations — highlights, cuisine, culture, tips, etc.
 * Results match the exact shape of curated destinations in destinations.json.
 *
 * Results are cached in sessionStorage to avoid redundant AI calls.
 */

import { makeGroqRequest } from './groq';

const CACHE_PREFIX = 'dest_enriched_';

/**
 * Generate rich destination data via AI.
 * Returns the same shape as curated destinations: highlights, cuisine, culture,
 * travelTips, bestTimeToVisit, language, timezone, bestFor, minBudgetPerDay, tags.
 */
export async function enrichDestinationWithAI(destinationName, country = '') {
    // Check cache first
    const cacheKey = `${CACHE_PREFIX}${destinationName}`;
    try {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) return JSON.parse(cached);
    } catch { /* ignore */ }

    const prompt = `You are a travel expert API. Generate detailed travel information for "${destinationName}"${country ? `, ${country}` : ''}.

Return ONLY valid JSON (no markdown fences) in this exact format:
{
  "description": "2-3 sentence compelling travel description",
  "language": "primary languages spoken",
  "timezone": "timezone abbreviation (UTC offset)",
  "bestFor": "target traveler types (e.g. 'Couples & History buffs')",
  "minBudgetPerDay": "estimated with currency symbol (e.g. '$80' or '₹1,500')",
  "bestTimeToVisit": {
    "season": "best months (e.g. 'October – March')",
    "note": "1-2 sentence explanation of why"
  },
  "tags": ["3-4 relevant tags like Nature, Culture, Beach, City, Adventure, History, Food, Spiritual"],
  "highlights": [
    { "name": "Landmark Name", "desc": "1-2 sentence description" },
    { "name": "Landmark Name", "desc": "1-2 sentence description" },
    { "name": "Landmark Name", "desc": "1-2 sentence description" },
    { "name": "Landmark Name", "desc": "1-2 sentence description" },
    { "name": "Landmark Name", "desc": "1-2 sentence description" }
  ],
  "cuisine": [
    { "name": "Dish Name", "desc": "1-2 sentence description" },
    { "name": "Dish Name", "desc": "1-2 sentence description" },
    { "name": "Dish Name", "desc": "1-2 sentence description" }
  ],
  "culture": "2-3 sentence description of cultural heritage, festivals, and traditions",
  "travelTips": [
    "practical tip 1",
    "practical tip 2",
    "practical tip 3",
    "practical tip 4"
  ]
}

Rules:
- Use ONLY real, verified places, dishes, and facts
- Be specific to this exact destination
- Budget estimates should be realistic for the local economy
- All 5 highlights must be real, well-known attractions`;

    try {
        const response = await makeGroqRequest([
            { role: 'system', content: 'You are a travel data API. Return strict JSON only. Never wrap in markdown code fences. Never hallucinate places or facts.' },
            { role: 'user', content: prompt },
        ], true);

        // Strip markdown fences if any
        const clean = response.replace(/```(?:json)?\s*/gi, '').replace(/```\s*$/gi, '').trim();
        const data = JSON.parse(clean);

        // Cache result
        try { sessionStorage.setItem(cacheKey, JSON.stringify(data)); } catch { /* quota */ }

        return data;
    } catch (err) {
        console.error('[DestinationEnrichment] AI enrichment failed:', err);
        return null;
    }
}
