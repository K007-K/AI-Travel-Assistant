-- ============================================================
-- RLS: Enable on trip_segments and cost_events tables
-- Date: 2026-02-18
-- ============================================================

-- ── trip_segments ────────────────────────────────────────────
-- Segments belong to a trip, so policy joins through trips.user_id
ALTER TABLE trip_segments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access segments of own trips"
ON trip_segments
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM trips
    WHERE trips.id = trip_segments.trip_id
      AND trips.user_id = auth.uid()
  )
);

-- ── cost_events ─────────────────────────────────────────────
ALTER TABLE cost_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access cost events of own trips"
ON cost_events
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM trips
    WHERE trips.id = cost_events.trip_id
      AND trips.user_id = auth.uid()
  )
);
