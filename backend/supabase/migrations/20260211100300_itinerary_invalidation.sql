-- Migration: Add itinerary invalidation support to trips table
-- Tracks what budget an itinerary was generated for and flags staleness.

-- Step 1: Add generation snapshot columns
ALTER TABLE trips
  ADD COLUMN IF NOT EXISTS generated_with_budget   numeric,
  ADD COLUMN IF NOT EXISTS generated_with_currency  text,
  ADD COLUMN IF NOT EXISTS itinerary_generated_at   timestamptz,
  ADD COLUMN IF NOT EXISTS itinerary_stale          boolean NOT NULL DEFAULT false;

-- Step 2: RPC to atomically update budget + detect staleness
CREATE OR REPLACE FUNCTION update_trip_budget(
  p_trip_id    uuid,
  p_new_budget numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_row trips%ROWTYPE;
BEGIN
  UPDATE trips SET
    budget          = p_new_budget,
    itinerary_stale = CASE
      WHEN generated_with_budget IS NOT NULL
       AND generated_with_budget != p_new_budget
      THEN true
      ELSE itinerary_stale  -- preserve current value
    END
  WHERE id = p_trip_id
  RETURNING * INTO v_row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Trip not found: %', p_trip_id;
  END IF;

  RETURN jsonb_build_object(
    'id',                    v_row.id,
    'budget',                v_row.budget,
    'itinerary_stale',       v_row.itinerary_stale,
    'generated_with_budget', v_row.generated_with_budget,
    'generated_with_currency', v_row.generated_with_currency,
    'itinerary_generated_at', v_row.itinerary_generated_at
  );
END;
$$;

-- Step 3: Backfill for existing trips that already have generated itineraries
-- Without this, the RPC never detects budget changes for pre-existing trips
UPDATE trips
SET generated_with_budget  = budget,
    generated_with_currency = COALESCE(currency, 'USD'),
    itinerary_generated_at = COALESCE(created_at, now())
WHERE generated_with_budget IS NULL
  AND days IS NOT NULL
  AND jsonb_array_length(days) > 0;

