/**
 * Geocoding helper — uses Supabase Edge Function to proxy Nominatim.
 * This avoids CORS issues in both development and production.
 */
import { supabase } from '../lib/supabase';

/**
 * Search for locations via the geocode edge function.
 * @param {string} query - search term
 * @param {number} limit - max results (default 8)
 * @returns {Array} Nominatim-format results
 */
export async function geocodeSearch(query, limit = 8) {
    if (!query?.trim()) return [];

    try {
        const { data, error } = await supabase.functions.invoke('geocode', {
            body: { q: query, limit },
        });

        if (error) {
            console.warn('[Geocode] Edge function error:', error.message);
            return [];
        }

        return Array.isArray(data) ? data : [];
    } catch (err) {
        console.warn('[Geocode] Failed:', err.message);
        return [];
    }
}
