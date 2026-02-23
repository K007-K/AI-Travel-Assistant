/**
 * Wikipedia REST API service — no API key required.
 *
 * Provides destination enrichment via Wikipedia's free REST API:
 * - Summary text + thumbnail images for any city/place
 * - Used by places.js to enrich search results
 *
 * API docs: https://en.wikipedia.org/api/rest_v1/
 */

const WIKI_API = 'https://en.wikipedia.org/api/rest_v1';

/**
 * Fetch a Wikipedia summary for a given topic (city, landmark, etc.)
 * Returns: { title, description, extract, thumbnail, coordinates }
 */
export async function fetchWikiSummary(topic) {
    try {
        const encoded = encodeURIComponent(topic.replace(/ /g, '_'));
        const res = await fetch(`${WIKI_API}/page/summary/${encoded}`, {
            headers: { 'Accept': 'application/json' },
        });
        if (!res.ok) return null;

        const data = await res.json();
        return {
            title: data.title,
            description: data.description || '',
            extract: data.extract || '',
            thumbnail: data.thumbnail?.source || null,
            originalImage: data.originalimage?.source || null,
            coordinates: data.coordinates || null,
        };
    } catch (err) {
        console.warn(`[WikiService] Failed to fetch summary for "${topic}":`, err.message);
        return null;
    }
}

/**
 * Fetch Wikipedia summaries for multiple topics in parallel.
 * Returns a Map<topic, summaryData>.
 */
export async function fetchWikiSummaries(topics) {
    const results = new Map();
    const promises = topics.map(async (topic) => {
        const summary = await fetchWikiSummary(topic);
        if (summary) results.set(topic, summary);
    });
    await Promise.all(promises);
    return results;
}
