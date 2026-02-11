-- =============================================
-- Migration: Create cost_events table
-- Unified ledger for ALL trip costs
-- =============================================

-- 1. Create the source enum
CREATE TYPE cost_source AS ENUM ('manual_expense', 'booking', 'ai_estimate');

-- 2. Create the table
CREATE TABLE cost_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id     uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  source      cost_source NOT NULL,
  category    text NOT NULL,
  amount      numeric NOT NULL,  -- allows negative for cancellation audit trail
  currency    text NOT NULL DEFAULT 'USD',
  description text,
  metadata    jsonb DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- 3. Indexes
CREATE INDEX idx_cost_events_trip_id ON cost_events(trip_id);
CREATE INDEX idx_cost_events_trip_category ON cost_events(trip_id, category);
CREATE INDEX idx_cost_events_created_at ON cost_events(created_at);
CREATE INDEX idx_cost_events_source ON cost_events(trip_id, source);

-- 4. Guard: prevent duplicate AI estimates for the same activity
CREATE UNIQUE INDEX idx_unique_ai_estimate
ON cost_events ((metadata->>'activity_id'))
WHERE source = 'ai_estimate';

-- 5. RLS
ALTER TABLE cost_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own trip costs"
ON cost_events FOR SELECT
TO authenticated
USING (
  trip_id IN (
    SELECT id FROM trips WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert own trip costs"
ON cost_events FOR INSERT
TO authenticated
WITH CHECK (
  trip_id IN (
    SELECT id FROM trips WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own trip costs"
ON cost_events FOR DELETE
TO authenticated
USING (
  trip_id IN (
    SELECT id FROM trips WHERE user_id = auth.uid()
  )
);
