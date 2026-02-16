-- ============================================================
-- Schema Remediation Phase 2: NOT NULL for destination
-- ============================================================

-- Backfill NULLs with empty string (no fake data)
UPDATE trips SET destination = '' WHERE destination IS NULL;

-- Enforce NOT NULL going forward
ALTER TABLE trips ALTER COLUMN destination SET NOT NULL;
