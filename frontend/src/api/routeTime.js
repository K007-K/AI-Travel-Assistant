/**
 * Route Time — Real Driving Times via OSRM
 *
 * Fetches actual driving duration between two cities using the free
 * OSRM (Open Source Routing Machine) API. Coordinates are resolved
 * from cityCoordinates.js first, then Nominatim if unknown.
 *
 * Results are cached in localStorage (30-day TTL).
 * Falls back to tier-based estimate if API fails.
 *
 * @module api/routeTime
 */

import { getCityCoords } from '../data/cityCoordinates.js';
import {
    _estimateDistanceTier as estimateDistanceTier,
} from '../utils/transportEngine.js';

// ── Cache ────────────────────────────────────────────────────────────

const CACHE_KEY = 'route_time_cache_v1';
const CACHE_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days

function getCache() {
    try {
        return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    } catch { return {}; }
}

function setCache(key, value) {
    try {
        const cache = getCache();
        cache[key] = { value, ts: Date.now() };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch { /* quota exceeded — ignore */ }
}

function getCached(key) {
    const cache = getCache();
    const entry = cache[key];
    if (entry && (Date.now() - entry.ts) < CACHE_TTL) return entry.value;
    return null;
}

// ── Tier fallback (when OSRM fails) ─────────────────────────────────

const TIER_HOURS_FALLBACK = {
    local:  0.5,
    short:  5,
    medium: 8,
    long:   12,
};

// ── Geocode helper (for cities not in cityCoordinates.js) ────────────

async function geocodeCity(cityName) {
    const coords = getCityCoords(cityName);
    if (coords) return coords;

    // Check geocode cache
    const cacheKey = `geo_${cityName.toLowerCase().trim()}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    // Strategy 1: Photon (CORS-friendly, works in production)
    try {
        const photonRes = await fetch(
            `https://photon.komoot.io/api/?q=${encodeURIComponent(cityName)}&limit=1`,
        );
        if (photonRes.ok) {
            const photonData = await photonRes.json();
            const feature = photonData.features?.[0];
            if (feature?.geometry?.coordinates) {
                const [lng, lat] = feature.geometry.coordinates;
                const result = { lat, lng };
                setCache(cacheKey, result);
                return result;
            }
        }
    } catch { /* Photon failed — try Nominatim */ }

    // Strategy 2: Nominatim fallback (works locally, may CORS in prod)
    try {
        const params = new URLSearchParams({
            format: 'json',
            q: cityName,
            limit: '1',
        });
        const res = await fetch(
            `https://nominatim.openstreetmap.org/search?${params}`,
            { headers: { 'User-Agent': 'RoameoTravelApp/1.0' } }
        );
        if (!res.ok) return null;
        const data = await res.json();
        if (data.length === 0) return null;

        const result = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        setCache(cacheKey, result);
        return result;
    } catch {
        return null;
    }
}

// ── OSRM API call ───────────────────────────────────────────────────

/**
 * Get real driving time and distance between two cities.
 *
 * @param {string} from — Origin city name
 * @param {string} to — Destination city name
 * @returns {Promise<{hours: number, distanceKm: number, source: 'osrm'|'fallback'}>}
 */
export async function getRouteTime(from, to) {
    const cacheKey = `${from.toLowerCase().trim()}_${to.toLowerCase().trim()}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    // Resolve coordinates
    const [fromCoords, toCoords] = await Promise.all([
        geocodeCity(from),
        geocodeCity(to),
    ]);

    if (!fromCoords || !toCoords) {
        // Fallback to tier estimate
        return fallbackEstimate(from, to);
    }

    try {
        const url = `https://router.project-osrm.org/route/v1/driving/${fromCoords.lng},${fromCoords.lat};${toCoords.lng},${toCoords.lat}?overview=false`;
        const res = await fetch(url);
        if (!res.ok) return fallbackEstimate(from, to);

        const data = await res.json();
        if (data.code !== 'Ok' || !data.routes?.[0]) return fallbackEstimate(from, to);

        const route = data.routes[0];
        const result = {
            hours: Math.round((route.duration / 3600) * 10) / 10, // seconds → hours, 1 decimal
            distanceKm: Math.round(route.distance / 1000),
            source: 'osrm',
        };

        setCache(cacheKey, result);
        return result;
    } catch {
        return fallbackEstimate(from, to);
    }
}

/**
 * Get route times for multiple city pairs in parallel.
 *
 * @param {Array<{from: string, to: string}>} pairs
 * @returns {Promise<Array<{from, to, hours, distanceKm, source}>>}
 */
export async function getRouteTimes(pairs) {
    const results = await Promise.all(
        pairs.map(async ({ from, to }) => {
            const result = await getRouteTime(from, to);
            return { from, to, ...result };
        })
    );
    return results;
}

// ── Fallback ─────────────────────────────────────────────────────────

function fallbackEstimate(from, to) {
    const tier = estimateDistanceTier(from, to);
    return {
        hours: TIER_HOURS_FALLBACK[tier] || 6,
        distanceKm: 0,
        source: 'fallback',
    };
}
