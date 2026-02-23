/**
 * Gemini API Service — AI-powered landmark & destination details.
 *
 * Replaces Wikipedia for landmark info. Uses Google Gemini API
 * (via VITE_GEMINI_API_KEY) to generate rich details about landmarks.
 * Results are cached in localStorage to avoid repeat API calls.
 */

const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-1.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`;

const CACHE_PREFIX = 'landmark:';

/**
 * Shared Gemini API caller with retry on 429 rate-limit.
 */
async function callGemini(prompt, { temperature = 0.3, maxOutputTokens = 512, retries = 2 } = {}) {
    if (!GEMINI_KEY) {
        console.warn('[GeminiService] VITE_GEMINI_API_KEY not set');
        return null;
    }

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const res = await fetch(GEMINI_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { temperature, maxOutputTokens },
                }),
            });

            if (res.status === 429 && attempt < retries) {
                // Exponential backoff: 2s, 4s
                const delay = 2000 * (attempt + 1);
                console.warn(`[GeminiService] Rate limited, retrying in ${delay}ms...`);
                await new Promise(r => setTimeout(r, delay));
                continue;
            }

            if (!res.ok) {
                console.warn(`[GeminiService] API error: ${res.status}`);
                return null;
            }

            const data = await res.json();
            const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!rawText) return null;

            // Strip markdown fences if present
            const clean = rawText.replace(/```(?:json)?\s*/gi, '').replace(/```\s*$/gi, '').trim();
            return JSON.parse(clean);
        } catch (err) {
            if (attempt < retries) continue;
            console.warn(`[GeminiService] Failed:`, err.message);
            return null;
        }
    }
    return null;
}

/**
 * Get rich details about a landmark/highlight via Gemini.
 * Returns: { history, significance, localTips, bestTime, entryFee }
 * Cached in localStorage.
 */
export async function getLandmarkDetails(landmarkName, destinationName = '') {
    if (!landmarkName) return null;

    // Check localStorage cache
    const cacheKey = `${CACHE_PREFIX}${landmarkName}:${destinationName}`;
    try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) return JSON.parse(cached);
    } catch { /* ignore */ }

    const prompt = `You are a travel expert. Provide detailed information about "${landmarkName}"${destinationName ? ` in ${destinationName}` : ''}.

Return ONLY valid JSON (no markdown fences, no explanation) in this exact format:
{
  "history": "2-3 sentence historical background of this place",
  "significance": "1-2 sentences on why this place is important or unique",
  "localTips": ["practical tip 1", "practical tip 2", "practical tip 3"],
  "bestTime": "best time to visit this specific place",
  "entryFee": "approximate entry fee or 'Free' if no entry fee"
}

Rules:
- Use ONLY real, verified facts
- Be specific to this exact landmark
- Keep it concise and traveler-friendly
- If unsure about entry fee, say "Check locally"`;

    const parsed = await callGemini(prompt, { temperature: 0.3, maxOutputTokens: 512 });

    if (parsed) {
        try { localStorage.setItem(cacheKey, JSON.stringify(parsed)); } catch { /* quota */ }
    }
    return parsed;
}

/**
 * Generate rich destination data via Gemini (replaces Groq-based enrichment).
 * Returns same shape as curated destinations: highlights, cuisine, culture, etc.
 * Cached in sessionStorage.
 */
export async function enrichDestinationWithGemini(destinationName, country = '') {
    const cacheKey = `dest_enriched_${destinationName}`;
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

    const parsed = await callGemini(prompt, { temperature: 0.4, maxOutputTokens: 1024 });

    if (parsed) {
        try { sessionStorage.setItem(cacheKey, JSON.stringify(parsed)); } catch { /* quota */ }
    }
    return parsed;
}
