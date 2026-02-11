-- ============================================================
-- Add route geometry columns to trip_segments for MapLibre
-- ============================================================

ALTER TABLE trip_segments
  ADD COLUMN IF NOT EXISTS route_geometry jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS route_distance numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS route_duration numeric DEFAULT NULL;

COMMENT ON COLUMN trip_segments.route_geometry IS 'GeoJSON LineString from ORS or straight-line fallback';
COMMENT ON COLUMN trip_segments.route_distance IS 'Route distance in meters';
COMMENT ON COLUMN trip_segments.route_duration IS 'Route duration in seconds';
