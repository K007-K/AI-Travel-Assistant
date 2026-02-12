-- Rule 5: Add budget_type column for strict/flexible budget enforcement
-- Allowed values: 'strict', 'flexible' (default)
ALTER TABLE trips
    ADD COLUMN IF NOT EXISTS budget_type text DEFAULT 'flexible';

-- Validate only allowed values
ALTER TABLE trips
    ADD CONSTRAINT chk_budget_type 
    CHECK (budget_type IN ('strict', 'flexible'));

-- Comment for documentation
COMMENT ON COLUMN trips.budget_type IS 'Budget enforcement mode: strict (rejects over-budget segments) or flexible (allows overspend with warning)';
