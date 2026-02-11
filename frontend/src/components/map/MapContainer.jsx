import { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import RouteLayer from './RouteLayer';
import MarkerLayer from './MarkerLayer';
import useMapSegments from '../../hooks/useMapSegments';

/**
 * MapContainer — root MapLibre GL JS component.
 * Uses OSM raster tiles (fully free, no API key).
 * Manages map lifecycle, auto-fit bounds, and child layers.
 */
export default function MapContainer({ trip, destination, onMapReady, highlightedSegmentId }) {
    const containerRef = useRef(null);
    const mapRef = useRef(null);
    const [mapLoaded, setMapLoaded] = useState(false);

    const { markers, routes, bounds } = useMapSegments(trip);

    // ── Initialize MapLibre ──────────────────────────────────────
    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;

        const map = new maplibregl.Map({
            container: containerRef.current,
            style: {
                version: 8,
                sources: {
                    'osm-tiles': {
                        type: 'raster',
                        tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
                        tileSize: 256,
                        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                    },
                },
                layers: [
                    {
                        id: 'osm-layer',
                        type: 'raster',
                        source: 'osm-tiles',
                        minzoom: 0,
                        maxzoom: 19,
                    },
                ],
            },
            center: [78.9629, 20.5937], // Default: India center
            zoom: 4,
            attributionControl: true,
        });

        // Navigation controls
        map.addControl(new maplibregl.NavigationControl(), 'top-right');

        map.on('load', () => {
            setMapLoaded(true);
            if (onMapReady) onMapReady(map);
        });

        mapRef.current = map;

        // Resize observer for responsive containers
        const ro = new ResizeObserver(() => map.resize());
        ro.observe(containerRef.current);

        return () => {
            ro.disconnect();
            map.remove();
            mapRef.current = null;
            setMapLoaded(false);
        };
    }, []);

    // ── Auto-fit bounds when markers/routes change ───────────────
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !mapLoaded) return;

        if (bounds) {
            map.fitBounds(bounds, { padding: 60, maxZoom: 14, duration: 800 });
        } else if (destination) {
            // Fallback: geocode destination
            geocodeAndCenter(map, destination);
        }
    }, [bounds, destination, mapLoaded]);

    // ── Highlight segment on click ───────────────────────────────
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !mapLoaded || !highlightedSegmentId) return;

        import('./HighlightController.js').then(({ highlightSegment }) => {
            highlightSegment(map, highlightedSegmentId, markers);
        });
    }, [highlightedSegmentId, mapLoaded, markers]);

    return (
        <div className="h-full w-full rounded-3xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700 relative">
            <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

            {/* Imperative child layers — render nothing, just add to map */}
            {mapLoaded && (
                <>
                    <RouteLayer map={mapRef.current} routes={routes} markers={markers} />
                    <MarkerLayer map={mapRef.current} markers={markers} />
                </>
            )}

            {/* Pulse animation CSS */}
            <style>{`
                .maplibre-custom-marker { cursor: pointer; }
                @keyframes marker-pulse-ring {
                    0% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.5); }
                    70% { box-shadow: 0 0 0 12px rgba(99, 102, 241, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0); }
                }
                .marker-pulse > div {
                    animation: marker-pulse-ring 1.5s ease-out infinite;
                }
            `}</style>
        </div>
    );
}

// ── Geocode helper (Nominatim, cached) ───────────────────────────

async function geocodeAndCenter(map, query) {
    const cacheKey = `geo:${query}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
        try {
            const [lat, lon] = JSON.parse(cached);
            map.flyTo({ center: [lon, lat], zoom: 10, duration: 800 });
            return;
        } catch { localStorage.removeItem(cacheKey); }
    }

    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
            { headers: { 'Accept-Language': 'en-US,en;q=0.9' } }
        );
        const data = await res.json();
        if (data?.[0]) {
            const lat = parseFloat(data[0].lat);
            const lon = parseFloat(data[0].lon);
            localStorage.setItem(cacheKey, JSON.stringify([lat, lon]));
            map.flyTo({ center: [lon, lat], zoom: 10, duration: 800 });
        }
    } catch (e) {
        console.error('Geocode failed:', e);
    }
}
