/**
 * HighlightController — manages segment highlighting on the MapLibre map.
 * Thickens a route line, zooms to its bounds, and adds a pulse marker.
 */

const HIGHLIGHT_LINE_WIDTH = 6;
const DEFAULT_LINE_WIDTH = 3;

export function highlightSegment(map, segmentId, markers) {
    if (!map) return;

    // Reset any existing highlights
    clearHighlight(map);

    // 1. Thicken the route line
    const layerId = `route-layer-route-${segmentId}`;
    if (map.getLayer(layerId)) {
        map.setPaintProperty(layerId, 'line-width', HIGHLIGHT_LINE_WIDTH);
        map.setPaintProperty(layerId, 'line-opacity', 1);
    }

    // 2. Zoom to segment bounds
    const sourceId = `route-source-route-${segmentId}`;
    const source = map.getSource(sourceId);
    if (source) {
        const data = source._data || source.serialize()?.data;
        if (data?.geometry?.coordinates) {
            const coords = data.geometry.coordinates;
            const lngs = coords.map(c => c[0]);
            const lats = coords.map(c => c[1]);
            const bounds = [
                [Math.min(...lngs), Math.min(...lats)],
                [Math.max(...lngs), Math.max(...lats)]
            ];
            map.fitBounds(bounds, { padding: 80, duration: 800 });
        }
    } else {
        // No route geometry — try to zoom to marker
        const marker = markers?.find(m => m.id === segmentId);
        if (marker) {
            map.flyTo({ center: [marker.lng, marker.lat], zoom: 14, duration: 800 });
        }
    }

    // 3. Pulse animation on active marker
    const markerEl = document.querySelector(`[data-segment-id="${segmentId}"]`);
    if (markerEl) {
        markerEl.classList.add('marker-pulse');
    }

    // Store active segment for cleanup
    map._activeSegmentId = segmentId;
}

export function clearHighlight(map) {
    if (!map || !map._activeSegmentId) return;

    const prevId = map._activeSegmentId;

    // Reset line width
    const layerId = `route-layer-route-${prevId}`;
    if (map.getLayer(layerId)) {
        map.setPaintProperty(layerId, 'line-width', DEFAULT_LINE_WIDTH);
        map.setPaintProperty(layerId, 'line-opacity', 0.7);
    }

    // Remove pulse
    const markerEl = document.querySelector(`[data-segment-id="${prevId}"]`);
    if (markerEl) {
        markerEl.classList.remove('marker-pulse');
    }

    map._activeSegmentId = null;
}
