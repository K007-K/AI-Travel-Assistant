-- ============================================================
-- RLS: Add missing UPDATE policy for cost_events
-- Date: 2026-02-19
-- ============================================================

DROP POLICY IF EXISTS "Users can update own trip costs" ON cost_events;
CREATE POLICY "Users can update own trip costs"
ON cost_events FOR UPDATE
TO authenticated
USING (
  trip_id IN (SELECT id FROM trips WHERE user_id = auth.uid())
);
