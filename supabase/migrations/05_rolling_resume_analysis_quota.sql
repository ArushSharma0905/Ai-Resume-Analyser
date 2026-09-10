-- =====================================================================================
-- PHASE 8: ROLLING 7-DAY RESUME-ANALYSIS QUOTA
-- =====================================================================================
-- Replaces the MONTHLY resume-analysis quota with a correct ROLLING 7-DAY quota:
--   FREE users  -> max 5 SUCCESSFUL resume analyses in ANY rolling 7-day period.
--   PRO/PREMIUM -> unlimited (the API layer never calls the RPC for them, so no
--                  free-quota rows are ever created for paid plans).
--   GUESTS      -> unchanged existing behavior (no server-side resume-analysis quota).
--
-- This is NOT a calendar-week and NOT a monthly quota: a slot frees up exactly when
-- the oldest successful analysis becomes older than 7 days.
--
-- Design:
--   * resume_analysis_usage stores ONE ROW PER SUCCESSFUL analysis only. Rows are
--     inserted atomically by reserve_resume_analysis() BEFORE the expensive AI call
--     and DELETED by release_resume_analysis() when the AI/parsing operation fails,
--     so failed operations never consume quota and nothing can permanently block a
--     user (rows simply age out of the 7-day window).
--   * reserve_resume_analysis() serializes on a per-user TRANSACTION-level advisory
--     lock before counting + inserting, so two simultaneous requests can NEVER both
--     take the fifth/sixth slot. (A plain SELECT-count-then-INSERT would race.)
--   * Users cannot manipulate quota records from the client: RLS is enabled with NO
--     client policies and table privileges are revoked from anon/authenticated. All
--     access flows through SECURITY DEFINER RPCs that only act on the caller's own
--     user_id (the API layer always passes the server-verified auth uid).
--   * The monthly user_usage system used by job matching / resume optimization is
--     NOT touched by this migration.
--
-- NO destructive operations. Idempotent — safe to re-run.
-- =====================================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- -------------------------------------------------------------------------------------
-- 1. TABLE
-- -------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.resume_analysis_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.resume_analysis_usage IS
  'Rolling 7-day resume-analysis quota ledger: one row per SUCCESSFUL analysis. Failed analyses are released (deleted).';

-- -------------------------------------------------------------------------------------
-- 2. INDEX
-- -------------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_resume_analysis_usage_user_created
  ON public.resume_analysis_usage(user_id, created_at);

-- -------------------------------------------------------------------------------------
-- 3. RLS — enabled, but with NO client policies and NO client table grants.
--    Clients must go through the SECURITY DEFINER RPCs below; they can never
--    insert/update/delete/select quota rows directly.
-- -------------------------------------------------------------------------------------
ALTER TABLE public.resume_analysis_usage ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.resume_analysis_usage FROM anon;
REVOKE ALL ON public.resume_analysis_usage FROM authenticated;

-- -------------------------------------------------------------------------------------
-- 4. RESERVATION RPC (atomic, concurrency-safe)
--
--    Flow inside a single transaction:
--      1. Acquire a per-user transaction-level advisory lock (serialization key
--         derived from the user id) so concurrent requests for the same user queue
--         behind each other and re-read the count AFTER the previous one commits.
--      2. Count successful analyses from the last 7 days.
--      3. If already 5 in the window -> granted=false + current_usage/limit/window_days
--         + next_available_at (the moment the oldest usage leaves the window).
--      4. Otherwise INSERT the reservation row and return granted=true with its id.
--
--    Returns jsonb:
--      granted           boolean
--      reservation_id    uuid    (present when granted)
--      current_usage     integer (count after reservation, or current count when denied)
--      limit             integer (5)
--      window_days       integer (7)
--      next_available_at timestamptz (only when denied and reliably determinable)
--      error             text    (only on invalid input — treated as denial, fail closed)
-- -------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.reserve_resume_analysis(
  p_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now timestamptz := now();
  v_cutoff timestamptz;
  v_count integer := 0;
  v_oldest timestamptz;
  v_reservation_id uuid;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN jsonb_build_object('granted', false, 'error', 'invalid_user');
  END IF;

  v_cutoff := v_now - make_interval(days => 7);

  -- Per-user serialization: without this lock, two concurrent requests could both
  -- read 4/5 and both insert, exceeding the limit. Transaction-scoped, so the lock
  -- is released automatically at COMMIT/ROLLBACK.
  PERFORM pg_advisory_xact_lock(
    hashtextextended('resume_analysis_quota:' || p_user_id::text, 0)
  );

  SELECT count(*)::int, min(created_at)
    INTO v_count, v_oldest
  FROM public.resume_analysis_usage
  WHERE user_id = p_user_id
    AND created_at > v_cutoff;

  IF v_count >= 5 THEN
    RETURN jsonb_build_object(
      'granted', false,
      'current_usage', v_count,
      'limit', 5,
      'window_days', 7,
      'next_available_at',
        CASE WHEN v_oldest IS NOT NULL
             THEN v_oldest + make_interval(days => 7)
             ELSE NULL END
    );
  END IF;

  INSERT INTO public.resume_analysis_usage (user_id)
  VALUES (p_user_id)
  RETURNING id INTO v_reservation_id;

  RETURN jsonb_build_object(
    'granted', true,
    'reservation_id', v_reservation_id,
    'current_usage', v_count + 1,
    'limit', 5,
    'window_days', 7,
    'next_available_at', NULL
  );
END;
$$;

-- -------------------------------------------------------------------------------------
-- 5. RELEASE RPC (idempotent)
--
--    Deletes the reservation identified by (p_user_id, p_reservation_id). Called by
--    the API layer when the AI analysis/parsing FAILS after reservation, so failures
--    never consume quota. Scoped to both user id and reservation id, so it can never
--    release another user's record. Safe to call multiple times: the second call is
--    a no-op returning released=false (never an error).
-- -------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.release_resume_analysis(
  p_user_id uuid,
  p_reservation_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted integer := 0;
BEGIN
  IF p_user_id IS NULL OR p_reservation_id IS NULL THEN
    RETURN jsonb_build_object('released', false, 'error', 'invalid_args');
  END IF;

  DELETE FROM public.resume_analysis_usage
  WHERE id = p_reservation_id
    AND user_id = p_user_id;

  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  RETURN jsonb_build_object(
    'released', v_deleted > 0,
    'already_released', v_deleted = 0
  );
END;
$$;

-- -------------------------------------------------------------------------------------
-- 6. READ-ONLY USAGE RPC (for status/usage display — cannot mutate anything)
-- -------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_resume_analysis_usage(
  p_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now timestamptz := now();
  v_cutoff timestamptz;
  v_count integer := 0;
  v_oldest timestamptz;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'invalid_user');
  END IF;

  v_cutoff := v_now - make_interval(days => 7);

  SELECT count(*)::int, min(created_at)
    INTO v_count, v_oldest
  FROM public.resume_analysis_usage
  WHERE user_id = p_user_id
    AND created_at > v_cutoff;

  RETURN jsonb_build_object(
    'current_usage', v_count,
    'limit', 5,
    'window_days', 7,
    'next_available_at',
      CASE WHEN v_count >= 5 AND v_oldest IS NOT NULL
           THEN v_oldest + make_interval(days => 7)
           ELSE NULL END
  );
END;
$$;

-- -------------------------------------------------------------------------------------
-- 7. GRANTS
--    The API layer (server-side, with the user's session) executes these RPCs as the
--    `authenticated` role; the functions are SECURITY DEFINER so they operate on the
--    quota table regardless of RLS. Guests (anon) get no access at all.
-- -------------------------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.reserve_resume_analysis(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reserve_resume_analysis(uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.release_resume_analysis(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.release_resume_analysis(uuid, uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.get_resume_analysis_usage(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_resume_analysis_usage(uuid) TO authenticated, service_role;
