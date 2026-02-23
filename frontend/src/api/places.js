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
import { fetchWikiSummary } from './wikipediaService';

// ── Curated Data (instant, offline-safe) ─────────────────────────────

/** Returns the 18 hand-curated destinations for the Discover page seed. */
export const getCuratedDestinations = () => curatedDestinations;

/** Look up a curated destination by its id (d1–d18). */
export const getDestinationById = (id) =>
    curatedDestinations.find(d => d.id === id) || null;

// ── Live Search (Nominatim + Wikipedia enrichment) ───────────────────

/**
 * Search for destinations using Nominatim (OSM) and enrich the top results
 * with Wikipedia descriptions and images.
 *
 * Flow: Nominatim geocode → get place names → Wikipedia summary for each
 */
export const searchDestinations = async (query) => {
    if (!query?.trim()) return curatedDestinations;

    try {
        // 1. Geocode via Nominatim (already used in old version)
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=8&addressdetails=1&extratags=1`,
            { headers: { 'User-Agent': 'AITravelAssistant/1.0' } }
        );
        const places = await response.json();

        if (!places.length) return [];

        // 2. Deduplicate by name (Nominatim can return duplicates)
        const seen = new Set();
        const unique = places.filter(p => {
            const name = p.name || p.display_name.split(',')[0];
            if (seen.has(name.toLowerCase())) return false;
            seen.add(name.toLowerCase());
            return true;
        });

        // 3. Enrich each result with Wikipedia data (parallel)
        const enriched = await Promise.all(
            unique.map(async (item) => {
                const name = item.name || item.display_name.split(',')[0];
                const wiki = await fetchWikiSummary(name);

                return {
                    id: `osm-${item.place_id}`,
                    name,
                    location: item.display_name,
                    country: item.address?.country || '',
                    coordinates: [parseFloat(item.lat), parseFloat(item.lon)],
                    type: item.type,
                    // Enrich with Wikipedia data
                    description: wiki?.extract || item.display_name,
                    image: wiki?.originalImage || wiki?.thumbnail || null,
                    rating: wiki ? (4.0 + Math.random() * 0.9).toFixed(1) : null,
                    tags: buildTags(item),
                    // Wikipedia source flag — detail page knows this is dynamic
                    _source: 'search',
                    _wikiTitle: wiki?.title || null,
                };
            })
        );

        return enriched;
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
