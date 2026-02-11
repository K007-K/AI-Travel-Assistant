/**
 * routeService.js — OpenRouteService integration for route fetching + caching.
 *
 * Called ONCE per transport segment at itinerary generation time.
 * Stores GeoJSON geometry in trip_segments.route_geometry via Supabase.
 * Map only renders stored geometry — zero ORS calls on render.
 */

const ORS_BASE = 'https://api.openrouteservice.org/v2/directions';
const ORS_KEY = import.meta.env.VITE_ORS_API_KEY;

// ORS transport profiles
const PROFILE_MAP = {
    car: 'driving-car',
    bike: 'cycling-regular',
    walking: 'foot-walking',
    bus: 'driving-car', // ORS doesn't have bus; approximate with car
    train: null,        // No road routing for train — use straight-line
    flight: null,       // No road routing for flight — use arc
    outbound_travel: null,
    return_travel: null,
    local_transport: 'driving-car',
    accommodation: null,
};

/**
 * Fetch route geometry from ORS for a given origin/destination.
 *
 * @param {{ lat: number, lng: number }} from - Start coordinates
 * @param {{ lat: number, lng: number }} to - End coordinates
 * @param {string} mode - Transport mode (car, bike, walking, etc.)
 * @returns {{ geometry: GeoJSON.LineString, distance: number, duration: number } | null}
 */
export async function fetchRoute(from, to, mode = 'car') {
    const profile = PROFILE_MAP[mode];

    // For non-routable modes (flight, train), generate a geodesic arc
    if (!profile) {
        return {
            geometry: generateArc(from, to),
            distance: haversineDistance(from, to),
            duration: 0,
        };
    }

    if (!ORS_KEY) {
        console.warn('ORS API key missing — using straight-line fallback');
        return {
            geometry: {
                type: 'LineString',
                coordinates: [[from.lng, from.lat], [to.lng, to.lat]],
            },
            distance: haversineDistance(from, to),
            duration: 0,
        };
    }

    try {
        const res = await fetch(`${ORS_BASE}/${profile}`, {
            method: 'POST',
            headers: {
                'Authorization': ORS_KEY,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                coordinates: [[from.lng, from.lat], [to.lng, to.lat]],
                format: 'geojson',
            }),
        });

        if (!res.ok) {
            console.error(`ORS error (${res.status}):`, await res.text());
            return null;
        }

        const data = await res.json();
        const feature = data.features?.[0];

        if (!feature) return null;

        return {
            geometry: feature.geometry, // GeoJSON LineString
            distance: feature.properties?.summary?.distance || 0, // meters
            duration: feature.properties?.summary?.duration || 0, // seconds
        };
    } catch (err) {
        console.error('ORS fetch failed:', err);
        return null;
    }
}

/**
 * Generate a geodesic arc (great circle) between two points.
 * Used for flights and long-distance train routes.
 */
function generateArc(from, to, numPoints = 30) {
    const coords = [];
    for (let i = 0; i <= numPoints; i++) {
        const t = i / numPoints;
        const lat = from.lat + (to.lat - from.lat) * t;
        const lng = from.lng + (to.lng - from.lng) * t;
        // Add slight curvature for visual appeal
        const arcHeight = Math.sin(Math.PI * t) * 2; // degrees of offset
        coords.push([lng, lat + arcHeight * 0.3]);
    }
    return { type: 'LineString', coordinates: coords };
}

/**
 * Haversine distance between two points in meters.
 */
function haversineDistance(from, to) {
    const R = 6371000;
    const dLat = ((to.lat - from.lat) * Math.PI) / 180;
    const dLon = ((to.lng - from.lng) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((from.lat * Math.PI) / 180) *
        Math.cos((to.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default fetchRoute;
