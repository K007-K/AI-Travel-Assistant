import { useMemo, useState, useEffect } from 'react';

/**
 * Geocode a location string using Nominatim with localStorage caching.
 */
async function geocode(query) {
    if (!query) return null;

    const cacheKey = `geo:${query}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
        try { return JSON.parse(cached); }
        catch { localStorage.removeItem(cacheKey); }
    }

    try {
        await new Promise(r => setTimeout(r, 1200)); // Rate-limit Nominatim

        const res = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
            { headers: { 'Accept-Language': 'en-US,en;q=0.9' } }
        );
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

    // Geocode activities sequentially
    useEffect(() => {
        let cancelled = false;

        async function geocodeAll() {
            if (!allActivities.length) {
                setMarkers([]);
                setGeocodingDone(true);
                return;
            }

            const destination = trip?.destination || '';
            const newMarkers = [];

            for (const activity of allActivities) {
                if (cancelled) break;
                if (!activity.location) continue;

                const query = `${activity.location}, ${destination}`;
                const coords = await geocode(query);

                if (coords && !cancelled) {
                    newMarkers.push({
                        id: activity.id,
                        title: activity.title,
                        lat: coords[0],
                        lng: coords[1],
                        type: activity.type,
                        segmentType: activity.segmentType || null,
                        isLogistics: !!activity.isLogistics,
                        dayNumber: activity.dayNumber,
                        orderIndex: activity.order_index ?? 0, // Rule 10: For sequence sorting
                        estimatedCost: activity.estimated_cost || 0,
                        location: activity.location,
                        safety_warning: activity.safety_warning,
                    });
                }
            }

            if (!cancelled) {
                // Rule 10: Sort markers by day_number ASC, order_index ASC
                // so fallback polyline connects in correct travel sequence
                newMarkers.sort((a, b) => {
                    if (a.dayNumber !== b.dayNumber) return a.dayNumber - b.dayNumber;
                    return (a.orderIndex || 0) - (b.orderIndex || 0);
                });
                setMarkers(newMarkers);
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
