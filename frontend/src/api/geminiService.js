/**
 * AI Service — landmark & destination details via Gemini → Groq fallback.
 *
 * Strategy: Try Gemini API first (free, no edge function needed).
 * If rate-limited (429), automatically falls back to Groq via edge function.
 * Results are cached in localStorage/sessionStorage to minimize API calls.
 */

import { makeGroqRequest } from './groq';

const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.0-flash-lite';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`;

const CACHE_PREFIX = 'landmark:';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

/** Read from localStorage with TTL check */
function cacheGet(key) {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        const { data, ts } = JSON.parse(raw);
        if (Date.now() - ts > CACHE_TTL) { localStorage.removeItem(key); return null; }
        return data;
    } catch { return null; }
}

/** Write to localStorage with timestamp */
function cacheSet(key, data) {
    try { localStorage.setItem(key, JSON.stringify({ data, ts: Date.now() })); } catch { /* quota */ }
}

/**
 * Call Gemini first; if 429/fail, fall back to Groq edge function.
 */
async function callAI(prompt) {
    // 1. Try Gemini (free, direct)
    if (GEMINI_KEY) {
        try {
            const res = await fetch(GEMINI_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
                }),
            });

            if (res.ok) {
                const data = await res.json();
                const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
                if (rawText) {
                    const clean = rawText.replace(/```(?:json)?\s*/gi, '').replace(/```\s*$/gi, '').trim();
                    return JSON.parse(clean);
                }
            } else {
                console.warn(`[AIService] Gemini ${res.status}, falling back to Groq...`);
            }
        } catch (e) {
            console.warn('[AIService] Gemini failed, falling back to Groq:', e.message);
        }
    }

    // 2. Fallback to Groq (via edge function — always works)
    try {
        const response = await makeGroqRequest([
            { role: 'system', content: 'You are a travel data API. Return strict JSON only. Never wrap in markdown code fences.' },
            { role: 'user', content: prompt },
        ], true);

        const clean = response.replace(/```(?:json)?\s*/gi, '').replace(/```\s*$/gi, '').trim();
        return JSON.parse(clean);
    } catch (e) {
        console.warn('[AIService] Groq fallback failed:', e.message);
        return null;
    }
}

/**
 * Get rich details about a landmark/highlight.
 * Returns: { history, significance, localTips, bestTime, entryFee }
 * Cached in localStorage.
 */
export async function getLandmarkDetails(landmarkName, destinationName = '') {
    if (!landmarkName) return null;

    const cacheKey = `${CACHE_PREFIX}${landmarkName}:${destinationName}`;
    const cached = cacheGet(cacheKey);
    if (cached) return cached;

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

    const parsed = await callAI(prompt);

    if (parsed) cacheSet(cacheKey, parsed);
    return parsed;
}

/**
 * Generate rich destination data (replaces Groq-only enrichment).
 * Returns same shape as curated destinations: highlights, cuisine, culture, etc.
 * Cached in sessionStorage.
 */
export async function enrichDestinationWithGemini(destinationName, country = '') {
    const cacheKey = `dest_enriched_${destinationName}`;
    const cached = cacheGet(cacheKey);
    if (cached) return cached;

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

    const parsed = await callAI(prompt);

    if (parsed) cacheSet(cacheKey, parsed);
    return parsed;
}
