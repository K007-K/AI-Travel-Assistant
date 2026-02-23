/**
 * Places API — Destination discovery and search.
 *
 * Data sources:
 *   1. Curated seed data (18 destinations in destinations.json) — instant load
 *   2. Nominatim (OpenStreetMap) — live geocoding/search, no API key
 *   3. Wikipedia REST API — rich descriptions + images, no API key
 *
 * No API keys required for any of these services.
 */

import curatedDestinations from '../data/destinations.json';
import { geocodeSearch } from './geocode';

// ── Curated Data (instant, offline-safe) ─────────────────────────────

/** Returns the 18 hand-curated destinations for the Discover page seed. */
export const getCuratedDestinations = () => curatedDestinations;

/** Look up a curated destination by its id (d1–d18). */
export const getDestinationById = (id) =>
    curatedDestinations.find(d => d.id === id) || null;

// ── Live Search (Nominatim via Edge Function) ───────────────────

/**
 * Search for destinations using Nominatim (OSM) via Supabase Edge Function.
 * No CORS issues in any environment.
 */
export const searchDestinations = async (query) => {
    if (!query?.trim()) return curatedDestinations;

    try {
        // 1. Geocode via edge function (no CORS issues)
        const places = await geocodeSearch(query, 8);

        if (!places.length) return [];

        // 2. Deduplicate by name (Nominatim can return duplicates)
        const seen = new Set();
        const unique = places.filter(p => {
            const name = p.name || p.display_name.split(',')[0];
            if (seen.has(name.toLowerCase())) return false;
            seen.add(name.toLowerCase());
            return true;
        });

        // 3. Build results (images loaded lazily on render, full enrichment on detail page)
        const results = unique.map((item) => {
            const name = item.name || item.display_name.split(',')[0];
            // Deterministic rating based on name hash (4.0–4.9)
            const hash = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
            const rating = (4.0 + (hash % 10) * 0.1).toFixed(1);
            return {
                id: `osm-${item.place_id}`,
                name,
                location: item.display_name,
                country: item.address?.country || '',
                coordinates: [parseFloat(item.lat), parseFloat(item.lon)],
                type: item.type,
                description: item.display_name,
                image: null, // Loaded lazily by component
                rating,
                tags: buildTags(item),
                _source: 'search',
            };
        });

        return results;
    } catch (error) {
        console.error('[Places] Search failed:', error);
        return [];
    }
};

// ── Helpers ──────────────────────────────────────────────────────────

/** Build tags from Nominatim type/class for category filtering. */
function buildTags(nominatimItem) {
    const tags = [];
    const type = nominatimItem.type || '';
    const cls = nominatimItem.class || '';

    if (['beach', 'bay', 'island', 'reef'].some(t => type.includes(t))) tags.push('Beach');
    if (['mountain', 'peak', 'volcano', 'hill'].some(t => type.includes(t))) tags.push('Nature');
    if (['city', 'town', 'village', 'hamlet'].some(t => type.includes(t))) tags.push('City');
    if (['museum', 'temple', 'church', 'castle', 'monument'].some(t => type.includes(t))) tags.push('Culture');
    if (['park', 'forest', 'nature_reserve', 'garden'].some(t => type.includes(t))) tags.push('Nature');
    if (cls === 'tourism' || cls === 'leisure') tags.push('Adventure');

    // Default tag if none matched
    if (tags.length === 0) tags.push('City');

    return [...new Set(tags)];
}
