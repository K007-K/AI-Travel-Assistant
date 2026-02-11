-- ============================================================
-- Phase 1: Upgrade trips table + create trip_segments
-- ============================================================

-- 1. Add constraint-driven columns to trips
ALTER TABLE trips ADD COLUMN IF NOT EXISTS start_location text;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS return_location text;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS travel_style text
  CHECK (travel_style IN ('road_trip', 'city_exploration', 'luxury_escape', 'backpacking', 'business_travel'));
ALTER TABLE trips ADD COLUMN IF NOT EXISTS own_vehicle_type text DEFAULT 'none'
  CHECK (own_vehicle_type IN ('car', 'bike', 'none'));
ALTER TABLE trips ADD COLUMN IF NOT EXISTS travel_preference text DEFAULT 'any'
  CHECK (travel_preference IN ('flight', 'train', 'bus', 'any'));
ALTER TABLE trips ADD COLUMN IF NOT EXISTS accommodation_preference text DEFAULT 'mid-range'
  CHECK (accommodation_preference IN ('budget', 'mid-range', 'luxury'));

-- 2. Create trip_segments table
CREATE TABLE IF NOT EXISTS trip_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  type text NOT NULL
    CHECK (type IN ('outbound_travel','accommodation','activity','local_transport','return_travel','food')),
  title text NOT NULL,
  start_time timestamptz,
  end_time timestamptz,
  day_number integer NOT NULL,
  location text,
  estimated_cost numeric DEFAULT 0,
  currency text DEFAULT 'USD',
  metadata jsonb DEFAULT '{}',
  booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Indexes for fast trip-day-order queries
CREATE INDEX IF NOT EXISTS idx_trip_segments_trip_day
  ON trip_segments(trip_id, day_number, order_index);

CREATE INDEX IF NOT EXISTS idx_trip_segments_type
  ON trip_segments(trip_id, type);

-- 3. RLS
ALTER TABLE trip_segments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own trip segments"
  ON trip_segments FOR SELECT
  USING (trip_id IN (SELECT id FROM trips WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own trip segments"
  ON trip_segments FOR INSERT
  WITH CHECK (trip_id IN (SELECT id FROM trips WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own trip segments"
  ON trip_segments FOR UPDATE
  USING (trip_id IN (SELECT id FROM trips WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own trip segments"
  ON trip_segments FOR DELETE
  USING (trip_id IN (SELECT id FROM trips WHERE user_id = auth.uid()));
