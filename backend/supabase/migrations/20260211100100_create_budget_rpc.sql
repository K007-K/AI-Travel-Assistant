-- =============================================
-- RPC: get_trip_budget_summary
-- Returns unified budget summary for a single trip
-- =============================================

CREATE OR REPLACE FUNCTION get_trip_budget_summary(p_trip_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  v_budget numeric;
  v_currency text;
  v_total_spent numeric;
  v_categories jsonb;
BEGIN
  -- Verify trip ownership
  IF NOT EXISTS (
    SELECT 1 FROM trips WHERE id = p_trip_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Trip not found or access denied';
  END IF;

  -- Get trip budget and currency
  SELECT budget, currency INTO v_budget, v_currency
  FROM trips WHERE id = p_trip_id;

  -- Total spent: sum of manual_expense + booking (negative amounts from
  -- cancellations naturally net out via SUM)
  SELECT COALESCE(SUM(amount), 0) INTO v_total_spent
  FROM cost_events
  WHERE trip_id = p_trip_id
    AND source IN ('manual_expense', 'booking');

  -- Category breakdown (all sources, negative amounts included)
  SELECT COALESCE(jsonb_agg(cat_row), '[]'::jsonb) INTO v_categories
  FROM (
    SELECT jsonb_build_object(
      'category', category,
      'total', SUM(amount),
      'count', COUNT(*),
      'by_source', jsonb_build_object(
        'manual', SUM(CASE WHEN source = 'manual_expense' THEN amount ELSE 0 END),
        'booking', SUM(CASE WHEN source = 'booking' THEN amount ELSE 0 END),
        'ai_estimate', SUM(CASE WHEN source = 'ai_estimate' THEN amount ELSE 0 END)
      )
    ) AS cat_row
    FROM cost_events
    WHERE trip_id = p_trip_id
    GROUP BY category
    ORDER BY SUM(amount) DESC
  ) sub;

  -- Build result
  result := jsonb_build_object(
    'total_budget', COALESCE(v_budget, 0),
    'currency', COALESCE(v_currency, 'USD'),
    'total_spent', v_total_spent,
    'remaining', COALESCE(v_budget, 0) - v_total_spent,
    'percent_used', CASE
      WHEN COALESCE(v_budget, 0) > 0
      THEN ROUND((v_total_spent / v_budget) * 100, 1)
      ELSE 0
    END,
    'ai_estimated_total', (
      SELECT COALESCE(SUM(amount), 0)
      FROM cost_events
      WHERE trip_id = p_trip_id AND source = 'ai_estimate'
    ),
    'category_breakdown', v_categories
  );

  RETURN result;
END;
$$;

-- =============================================
-- RPC: get_user_budget_overview
-- Returns cross-trip budget summary for the authenticated user
-- =============================================

CREATE OR REPLACE FUNCTION get_user_budget_overview()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_budget_all_trips', COALESCE(SUM(t.budget), 0),
    'total_spent_all_trips', COALESCE((
      SELECT SUM(ce.amount)
      FROM cost_events ce
      JOIN trips t2 ON ce.trip_id = t2.id
      WHERE t2.user_id = auth.uid()
        AND ce.source IN ('manual_expense', 'booking')
    ), 0),
    'trip_count', COUNT(*),
    'trips', COALESCE(jsonb_agg(
      jsonb_build_object(
        'trip_id', t.id,
        'title', t.title,
        'destination', t.destination,
        'budget', t.budget,
        'currency', t.currency,
        'spent', COALESCE((
          SELECT SUM(amount)
          FROM cost_events
          WHERE trip_id = t.id
            AND source IN ('manual_expense', 'booking')
        ), 0)
      )
    ), '[]'::jsonb)
  ) INTO result
  FROM trips t
  WHERE t.user_id = auth.uid();

  RETURN result;
END;
$$;
