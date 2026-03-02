-- Drop the restrictive CHECK constraint on trip_segments.type
-- to allow new segment types: allocation, hidden_gem, intercity_travel, gem
DO $$
BEGIN
  ALTER TABLE trip_segments DROP CONSTRAINT IF EXISTS trip_segments_type_check;
EXCEPTION WHEN OTHERS THEN
  NULL; -- constraint may not exist, that's fine
END $$;
