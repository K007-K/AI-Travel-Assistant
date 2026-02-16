-- ============================================================
-- Schema Remediation Phase 2: NOT NULL for destination + duration
-- Safe backfill: empty string for destination, 1 for duration
-- ============================================================

-- Backfill NULLs with sensible defaults (no fake data)
UPDATE trips SET destination = '' WHERE destination IS NULL;
UPDATE trips SET duration = 1 WHERE duration IS NULL;

-- Enforce NOT NULL going forward
ALTER TABLE trips ALTER COLUMN destination SET NOT NULL;
ALTER TABLE trips ALTER COLUMN duration SET DEFAULT 1;
ALTER TABLE trips ALTER COLUMN duration SET NOT NULL;
