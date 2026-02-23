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

        if (res.ok) {
            const data = await res.json();
            if (data.extract) {
                return {
                    title: data.title,
                    description: data.description || '',
                    extract: data.extract || '',
                    thumbnail: data.thumbnail?.source || null,
                    originalImage: data.originalimage?.source || null,
                    coordinates: data.coordinates || null,
                };
            }
        }

        // Fallback: search Wikipedia for a matching article
        const searchRes = await fetch(
            `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(topic)}&srlimit=3&format=json&origin=*`
        );
        if (!searchRes.ok) return null;

        const searchData = await searchRes.json();
        const hits = searchData?.query?.search || [];

        // Find a hit whose title is similar to the topic (contains key words)
        const topicWords = topic.toLowerCase().split(/\s+/).filter(w => w.length > 3);
        const bestHit = hits.find(h => {
            const hitLower = h.title.toLowerCase();
            return topicWords.some(w => hitLower.includes(w));
        });

        if (bestHit) {
            const hitEncoded = encodeURIComponent(bestHit.title.replace(/ /g, '_'));
            const hitRes = await fetch(`${WIKI_API}/page/summary/${hitEncoded}`, {
                headers: { 'Accept': 'application/json' },
            });
            if (hitRes.ok) {
                const hitData = await hitRes.json();
                if (hitData.extract) {
                    return {
                        title: hitData.title,
                        description: hitData.description || '',
                        extract: hitData.extract || '',
                        thumbnail: hitData.thumbnail?.source || null,
                        originalImage: hitData.originalimage?.source || null,
                        coordinates: hitData.coordinates || null,
                    };
                }
            }
        }

        return null;
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
