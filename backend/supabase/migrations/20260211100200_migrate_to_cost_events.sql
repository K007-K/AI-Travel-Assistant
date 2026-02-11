-- =============================================
-- Data Migration: expenses + bookings → cost_events
-- =============================================

-- Step 1: Migrate existing expenses → cost_events
INSERT INTO cost_events (trip_id, source, category, amount, currency, description, metadata, created_at)
SELECT
  e.trip_id,
  'manual_expense'::cost_source,
  e.category,
  e.amount,
  COALESCE(t.currency, 'USD'),
  e.description,
  jsonb_build_object('original_expense_id', e.id),
  COALESCE(e.date::timestamptz, now())
FROM expenses e
JOIN trips t ON e.trip_id = t.id;

-- Step 2: Add trip_id column to bookings (was missing)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS trip_id uuid REFERENCES trips(id);

-- Step 3: Migrate bookings that have a trip_id into cost_events
-- (existing bookings likely have NULL trip_id — only future ones will populate)
INSERT INTO cost_events (trip_id, source, category, amount, currency, description, metadata, created_at)
SELECT
  b.trip_id,
  'booking'::cost_source,
  b.type,
  b.price,
  COALESCE(b.details->>'currency', 'USD'),
  COALESCE(b.details->>'title', b.type || ' booking'),
  jsonb_build_object(
    'booking_id', b.id,
    'booking_type', b.type,
    'pnr', b.details->>'pnr',
    'status', b.status
  ),
  b.booked_at
FROM bookings b
WHERE b.trip_id IS NOT NULL
  AND b.status != 'cancelled';
