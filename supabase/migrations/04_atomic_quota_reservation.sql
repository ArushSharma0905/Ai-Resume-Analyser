-- =====================================================================================
-- PHASE 7.3: ATOMIC USAGE CHECK + RESERVATION
-- Fixes the TOCTOU race condition in checkFeatureUsageLimit / incrementFeatureUsage.
--
-- Previous flow was non-atomic:
--   1. checkFeatureUsageLimit()  -> SELECT current usage count   (read)
--   2. AI operation runs
--   3. incrementFeatureUsage()   -> UPDATE count + 1              (write)
-- Between steps 1 and 3, concurrent requests can all read the same count,
-- all pass the limit check, and collectively exceed the configured plan limit.
--
-- This migration adds a SINGLE atomic RPC that performs the check AND the
-- increment in one statement. The guarded UPDATE
--     ... SET count = count + 1 WHERE count < p_limit RETURNING count
-- is atomic under PostgreSQL's Read Committed isolation: concurrent updates
-- on the same row are serialized by row-level locking and the WHERE guard is
-- re-evaluated against the committed row, so usage can NEVER exceed the limit.
--
-- The caller only proceeds with the AI operation when granted is true; on
-- denial the request is rejected with HTTP 429 and NO usage credit consumed.
--
-- NO new tables. NO destructive operations (CREATE OR REPLACE only).
-- Idempotent — safe to re-run.
-- =====================================================================================

-- 1. ATOMIC CHECK-AND-RESERVE FUNCTION
--
--    Returns a JSON object with:
--      granted        boolean  — whether a credit was successfully reserved
--      current_usage  integer  — the usage count AFTER the increment (or the
--                                current count when denied)
--      limit          integer  — the plan limit that was enforced
--      error          text     — present only on invalid input (unknown feature)
--
--    If this function throws, the caller must treat the request as denied.
CREATE OR REPLACE FUNCTION public.reserve_feature_usage(
  p_user_id uuid,
  p_feature text,           -- 'resume_analyses' | 'job_matches' | 'resume_optimizations'
  p_limit integer           -- server-side authoritative limit for the user's plan
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
  v_period_start date := date_trunc('month', current_date)::date;
  v_period_end date := (date_trunc('month', current_date) + interval '1 month - 1 day')::date;
BEGIN
  -- Defensive: an invalid limit can never grant a reservation (fail closed).
  IF p_limit IS NULL OR p_limit < 0 THEN
    RETURN jsonb_build_object('granted', false, 'error', 'invalid_limit');
  END IF;

  -- Ensure the usage row exists for this period (idempotent, no-op on conflict).
  INSERT INTO public.user_usage (user_id, period_start, period_end)
  VALUES (p_user_id, v_period_start, v_period_end)
  ON CONFLICT (user_id, period_start) DO NOTHING;

  IF p_feature = 'resume_analyses' THEN
    -- Single atomic guarded increment: only increments when under the limit.
    UPDATE public.user_usage
    SET resume_analyses_count = resume_analyses_count + 1, updated_at = now()
    WHERE user_id = p_user_id
      AND period_start = v_period_start
      AND resume_analyses_count < p_limit
    RETURNING resume_analyses_count INTO v_count;

  ELSIF p_feature = 'job_matches' THEN
    UPDATE public.user_usage
    SET job_matches_count = job_matches_count + 1, updated_at = now()
    WHERE user_id = p_user_id
      AND period_start = v_period_start
      AND job_matches_count < p_limit
    RETURNING job_matches_count INTO v_count;

  ELSIF p_feature = 'resume_optimizations' THEN
    UPDATE public.user_usage
    SET resume_optimizations_count = resume_optimizations_count + 1, updated_at = now()
    WHERE user_id = p_user_id
      AND period_start = v_period_start
      AND resume_optimizations_count < p_limit
    RETURNING resume_optimizations_count INTO v_count;

  ELSE
    -- Unknown feature — do not reserve anything, deny access (fail closed).
    RETURN jsonb_build_object('granted', false, 'error', 'unknown_feature');
  END IF;

  IF v_count IS NULL THEN
    -- The guard failed: limit already reached. Report the real current count.
    -- (Read without increment — purely informational for the 429 payload.)
    IF p_feature = 'resume_analyses' THEN
      SELECT resume_analyses_count INTO v_count
      FROM public.user_usage
      WHERE user_id = p_user_id AND period_start = v_period_start;
    ELSIF p_feature = 'job_matches' THEN
      SELECT job_matches_count INTO v_count
      FROM public.user_usage
      WHERE user_id = p_user_id AND period_start = v_period_start;
    ELSE
      SELECT resume_optimizations_count INTO v_count
      FROM public.user_usage
      WHERE user_id = p_user_id AND period_start = v_period_start;
    END IF;

    RETURN jsonb_build_object(
      'granted', false,
      'current_usage', COALESCE(v_count, 0),
      'limit', p_limit
    );
  END IF;

  -- Reservation succeeded: the credit is consumed atomically.
  RETURN jsonb_build_object(
    'granted', true,
    'current_usage', v_count,
    'limit', p_limit
  );
END;
$$;

-- Grant execute to authenticated users and the service role.
GRANT EXECUTE ON FUNCTION public.reserve_feature_usage TO authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_feature_usage TO service_role;


-- 2. RELEASE FUNCTION (refund a reserved credit when the AI operation fails)
--    Decrements the counter for the current period, never below zero.
--    Used ONLY to undo a reservation after a failed AI operation, so failed
--    operations do not consume quota. Increments themselves remain atomic.
CREATE OR REPLACE FUNCTION public.release_feature_usage(
  p_user_id uuid,
  p_feature text -- 'resume_analyses' | 'job_matches' | 'resume_optimizations'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
  v_period_start date := date_trunc('month', current_date)::date;
BEGIN
  IF p_feature = 'resume_analyses' THEN
    UPDATE public.user_usage
    SET resume_analyses_count = GREATEST(resume_analyses_count - 1, 0), updated_at = now()
    WHERE user_id = p_user_id AND period_start = v_period_start
    RETURNING resume_analyses_count INTO v_count;

  ELSIF p_feature = 'job_matches' THEN
    UPDATE public.user_usage
    SET job_matches_count = GREATEST(job_matches_count - 1, 0), updated_at = now()
    WHERE user_id = p_user_id AND period_start = v_period_start
    RETURNING job_matches_count INTO v_count;

  ELSIF p_feature = 'resume_optimizations' THEN
    UPDATE public.user_usage
    SET resume_optimizations_count = GREATEST(resume_optimizations_count - 1, 0), updated_at = now()
    WHERE user_id = p_user_id AND period_start = v_period_start
    RETURNING resume_optimizations_count INTO v_count;

  ELSE
    RETURN jsonb_build_object('released', false, 'error', 'unknown_feature');
  END IF;

  RETURN jsonb_build_object(
    'released', v_count IS NOT NULL,
    'current_usage', COALESCE(v_count, 0)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.release_feature_usage TO authenticated;
GRANT EXECUTE ON FUNCTION public.release_feature_usage TO service_role;
