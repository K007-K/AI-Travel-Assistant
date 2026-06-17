/**
 * Geocoding helper — fetches directly from Nominatim to ensure English results.
 * (Bypasses edge function to allow frontend-only deployment of language fixes).
 */

/**
 * Search for locations via Nominatim API.
 * @param {string} query - search term
 * @param {number} limit - max results (default 8)
 * @returns {Array} Nominatim-format results
 */
export async function geocodeSearch(query, limit = 8) {
    if (!query?.trim()) return [];

    try {
        const params = new URLSearchParams({
            format: 'json',
            q: query,
            limit: String(limit),
            addressdetails: '1',
            extratags: '1',
            'accept-language': 'en', // Force English language results
        });

        const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
            headers: {
                'User-Agent': 'RoameoTravelApp/1.0 (contact@roameo.app)',
                'Accept': 'application/json',
            }
        });

        if (!response.ok) {
            console.warn('[Geocode] Nominatim API error:', response.status);
            return [];
        }

        const data = await response.json();
        return Array.isArray(data) ? data : [];
    } catch (err) {
        console.warn('[Geocode] Failed:', err.message);
        return [];
    }
}
