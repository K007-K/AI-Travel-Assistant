-- ============================================================
-- Schema Remediation Migration
-- Fixes: FK, NOT NULL, CHECK constraints, indexes, dead assets
-- Date: 2026-02-17
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 2a. Fix bookings.trip_id FK — add ON DELETE SET NULL
-- ────────────────────────────────────────────────────────────
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_trip_id_fkey;
ALTER TABLE bookings
  ADD CONSTRAINT bookings_trip_id_fkey
  FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE SET NULL;

-- ────────────────────────────────────────────────────────────
-- 2b. Backfill + NOT NULL — enforce required fields
--     No fake values: budget/currency get sensible defaults,
--     destination/duration stay nullable (form enforces them)
-- ────────────────────────────────────────────────────────────
UPDATE trips SET budget = 0 WHERE budget IS NULL;
UPDATE trips SET currency = 'USD' WHERE currency IS NULL;

ALTER TABLE trips ALTER COLUMN budget SET DEFAULT 0;
ALTER TABLE trips ALTER COLUMN budget SET NOT NULL;
ALTER TABLE trips ALTER COLUMN currency SET DEFAULT 'USD';
ALTER TABLE trips ALTER COLUMN currency SET NOT NULL;

-- NOTE: destination and duration intentionally left nullable.
-- The CreateTripForm enforces them via validation, but older
-- rows may have legitimate NULLs. No fake "Unknown" backfills.

-- ────────────────────────────────────────────────────────────
-- 2c. CHECK constraints — fully idempotent via DO blocks
-- ────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_budget_non_negative'
  ) THEN
    ALTER TABLE trips ADD CONSTRAINT chk_budget_non_negative CHECK (budget >= 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_booking_status'
  ) THEN
    ALTER TABLE bookings ADD CONSTRAINT chk_booking_status
      CHECK (status IN ('confirmed', 'cancelled', 'pending'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_booking_price_non_negative'
  ) THEN
    ALTER TABLE bookings ADD CONSTRAINT chk_booking_price_non_negative CHECK (price >= 0);
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────
-- 2d. Missing indexes — performance
-- ────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_trip_id ON bookings(trip_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_trip_segments_booking_id ON trip_segments(booking_id);

-- ============================================================
-- Phase 3: Dead Asset Cleanup
-- ============================================================

-- Dead table: fully migrated to cost_events, zero references
DROP TABLE IF EXISTS expenses;

-- Dead column: written as null, days derived from trip_segments
ALTER TABLE trips DROP COLUMN IF EXISTS days;

-- Dead RPCs: zero calls in app code
DROP FUNCTION IF EXISTS get_user_budget_overview();
DROP FUNCTION IF EXISTS match_documents(vector(768), float, int);
