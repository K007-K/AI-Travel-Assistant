/**
 * routeService.js — Route fetching via Edge Function proxy + caching.
 *
 * Called ONCE per transport segment at itinerary generation time.
 * Stores GeoJSON geometry in trip_segments.route_geometry via Supabase.
 * Map only renders stored geometry — zero ORS calls on render.
 *
 * The ORS API key is kept server-side in the route-proxy edge function.
 */

import { supabase } from '../lib/supabase';

// ORS transport profiles
const PROFILE_MAP = {
    car: 'driving-car',
    bike: 'cycling-regular',
    walking: 'foot-walking',
    bus: 'driving-car', // ORS doesn't have bus; approximate with car
    train: null,        // No road routing for train — use straight-line
    flight: null,       // No road routing for flight — use arc
    outbound_travel: null,
    intercity_travel: null,
    return_travel: null,
    local_transport: 'driving-car',
    accommodation: null,
};

/**
 * Fetch route geometry via the route-proxy edge function.
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

    try {
        const { data, error } = await supabase.functions.invoke('route-proxy', {
            body: { from, to, profile }
        });

        if (error) {
            console.warn('Route proxy error — using straight-line fallback:', error.message);
            return {
                geometry: {
                    type: 'LineString',
                    coordinates: [[from.lng, from.lat], [to.lng, to.lat]],
                },
                distance: haversineDistance(from, to),
                duration: 0,
            };
        }

        const feature = data.features?.[0];

        if (!feature) return null;

        return {
            geometry: feature.geometry, // GeoJSON LineString
            distance: feature.properties?.summary?.distance || 0, // meters
            duration: feature.properties?.summary?.duration || 0, // seconds
        };
    } catch (err) {
        console.error('Route fetch failed:', err);
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
