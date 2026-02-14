import { useMemo, useState, useEffect } from 'react';

/**
 * Geocode a location string using Nominatim with localStorage caching.
 * Optionally accepts a viewbox to bias results toward a region.
 */
async function geocode(query, viewbox = null) {
    if (!query) return null;

    const cacheKey = viewbox ? `geo:${query}:vb` : `geo:${query}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
        try { return JSON.parse(cached); }
        catch { localStorage.removeItem(cacheKey); }
    }

    try {
        await new Promise(r => setTimeout(r, 1200)); // Rate-limit Nominatim

        let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
        if (viewbox) {
            url += `&viewbox=${viewbox}&bounded=0`;
        }

        const res = await fetch(url, {
            headers: { 'Accept-Language': 'en-US,en;q=0.9' }
        });
        if (!res.ok) return null;
        const data = await res.json();

        if (data?.[0]) {
            const coords = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
            localStorage.setItem(cacheKey, JSON.stringify(coords));
            return coords;
        }
    } catch (e) {
        console.error(`Geocode failed for "${query}":`, e);
    }
    return null;
}

/**
 * Compute haversine distance in km between two lat/lng points.
 */
function haversineKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Extract markers, route lines, and combined bounds from trip data.
 * Geocodes location strings and caches results.
 */
export default function useMapSegments(trip) {
    const [markers, setMarkers] = useState([]);
    const [geocodingDone, setGeocodingDone] = useState(false);

    // Flatten all activities from trip days
    const allActivities = useMemo(() => {
        if (!trip?.days) return [];
        return trip.days.flatMap(day =>
            (day.activities || []).map(a => ({ ...a, dayNumber: day.dayNumber }))
        );
    }, [trip?.days]);

    // Extract routes from segments that have stored route_geometry
    const routes = useMemo(() => {
        return allActivities
            .filter(a => a.route_geometry)
            .map(a => ({
                id: `route-${a.id}`,
                segmentId: a.id,
                geometry: a.route_geometry,
                transportMode: a.segmentType || a.type || 'car',
                distance: a.route_distance,
                duration: a.route_duration,
            }));
    }, [allActivities]);

    // Geocode activities — prefer embedded coordinates, fallback to Nominatim
    useEffect(() => {
        let cancelled = false;

        async function geocodeAll() {
            if (!allActivities.length) {
                setMarkers([]);
                setGeocodingDone(true);
                return;
            }

            const destination = trip?.destination || '';

            // Step 1: Geocode the trip destination itself to build a viewbox
            let destLat = null, destLng = null;
            if (destination) {
                const destCoords = await geocode(destination);
                if (destCoords) {
                    destLat = destCoords[0];
                    destLng = destCoords[1];
                }
            }

            // Build a Nominatim viewbox (±3 degrees around destination)
            const viewbox = (destLat != null && destLng != null)
                ? `${destLng - 3},${destLat + 3},${destLng + 3},${destLat - 3}`
                : null;

            const newMarkers = [];

            for (const activity of allActivities) {
                if (cancelled) break;
                if (!activity.location) continue;

                let lat = null, lng = null;

                // Prefer embedded coordinates from orchestrator geocoding
                if (activity.latitude && activity.longitude) {
                    lat = parseFloat(activity.latitude);
                    lng = parseFloat(activity.longitude);
                }

                // Fallback: Nominatim geocoding with viewbox bias
                if (lat == null || lng == null || (lat === 0 && lng === 0)) {
                    const query = `${activity.location}, ${destination}`;
                    const coords = await geocode(query, viewbox);
                    if (coords) {
                        lat = coords[0];
                        lng = coords[1];
                    }
                }

                // Skip if still no valid coordinates
                if (lat == null || lng == null || (lat === 0 && lng === 0)) continue;

                if (!cancelled) {
                    newMarkers.push({
                        id: activity.id,
                        title: activity.title,
                        lat,
                        lng,
                        type: activity.type,
                        segmentType: activity.segmentType || null,
                        isLogistics: !!activity.isLogistics,
                        dayNumber: activity.dayNumber,
                        orderIndex: activity.order_index ?? 0,
                        estimatedCost: activity.estimated_cost || 0,
                        location: activity.location,
                        safety_warning: activity.safety_warning,
                    });
                }
            }

            if (!cancelled && newMarkers.length > 0) {
                // ── Outlier detection: remove markers too far from the cluster ──
                let refLat = destLat, refLng = destLng;
                if (refLat == null || refLng == null) {
                    // Fallback: median of all markers
                    const sortedLats = [...newMarkers].sort((a, b) => a.lat - b.lat);
                    const sortedLngs = [...newMarkers].sort((a, b) => a.lng - b.lng);
                    const mid = Math.floor(sortedLats.length / 2);
                    refLat = sortedLats[mid].lat;
                    refLng = sortedLngs[mid].lng;
                }

                const MAX_DISTANCE_KM = 500;
                const validMarkers = newMarkers.filter(m => {
                    const dist = haversineKm(refLat, refLng, m.lat, m.lng);
                    if (dist > MAX_DISTANCE_KM) {
                        console.warn(`[MapSegments] Dropping outlier "${m.title}" (${dist.toFixed(0)}km from ${destination})`);
                        // Clear bad cache so it re-geocodes next time
                        localStorage.removeItem(`geo:${m.location}, ${destination}`);
                        localStorage.removeItem(`geo:${m.location}, ${destination}:vb`);
                        return false;
                    }
                    return true;
                });

                // Sort markers by day_number ASC, order_index ASC
                validMarkers.sort((a, b) => {
                    if (a.dayNumber !== b.dayNumber) return a.dayNumber - b.dayNumber;
                    return (a.orderIndex || 0) - (b.orderIndex || 0);
                });
                setMarkers(validMarkers);
                setGeocodingDone(true);
            } else if (!cancelled) {
                setMarkers([]);
                setGeocodingDone(true);
            }
        }

        setGeocodingDone(false);
        geocodeAll();
        return () => { cancelled = true; };
    }, [allActivities, trip?.destination]);

    // Compute combined bounds from markers + route geometries
    const bounds = useMemo(() => {
        const allCoords = [];

        for (const m of markers) {
            allCoords.push([m.lng, m.lat]);
        }

        for (const r of routes) {
            if (r.geometry?.coordinates) {
                allCoords.push(...r.geometry.coordinates);
            }
        }

        if (allCoords.length === 0) return null;

        let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
        for (const [lng, lat] of allCoords) {
            if (lng < minLng) minLng = lng;
            if (lat < minLat) minLat = lat;
            if (lng > maxLng) maxLng = lng;
            if (lat > maxLat) maxLat = lat;
        }

        return [[minLng, minLat], [maxLng, maxLat]];
    }, [markers, routes]);

    return { markers, routes, bounds, geocodingDone };
}
