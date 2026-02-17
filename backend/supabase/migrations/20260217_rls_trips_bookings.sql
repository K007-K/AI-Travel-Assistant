-- ============================================================
-- RLS: Enable on trips and bookings tables
-- Date: 2026-02-17
-- ============================================================

-- ── trips ────────────────────────────────────────────────────
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access own trips"
ON trips
FOR ALL
USING (auth.uid() = user_id);

-- ── bookings ─────────────────────────────────────────────────
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access own bookings"
ON bookings
FOR ALL
USING (auth.uid() = user_id);
