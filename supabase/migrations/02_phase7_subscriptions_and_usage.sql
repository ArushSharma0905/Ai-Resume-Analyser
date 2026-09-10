-- ==============================================================================
-- PHASE 7: REAL PAYMENTS, SUBSCRIPTIONS & SERVER-SIDE USAGE LIMITS
-- Razorpay Integration, Idempotent Webhooks & Anti-Tamper Security
-- ==============================================================================

-- 1. ADD PAYMENT AUDIT COLUMNS TO SUBSCRIPTIONS
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS provider_payment_id text,
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'INR',
  ADD COLUMN IF NOT EXISTS amount integer DEFAULT 0;

-- 2. CREATE PAYMENT ORDERS TABLE (Tracks Razorpay checkout intents)
CREATE TABLE IF NOT EXISTS public.payment_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id text NOT NULL UNIQUE,
  plan_tier text NOT NULL CHECK (plan_tier IN ('pro', 'premium')),
  billing_cycle text NOT NULL DEFAULT 'monthly',
  amount integer NOT NULL, -- in paise (e.g. 19900 for ₹199)
  currency text NOT NULL DEFAULT 'INR',
  status text NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'paid', 'failed', 'expired')),
  payment_id text,
  signature text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- 3. CREATE USER USAGE TABLE (Monthly AI Quotas)
CREATE TABLE IF NOT EXISTS public.user_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start date NOT NULL DEFAULT date_trunc('month', current_date)::date,
  period_end date NOT NULL DEFAULT (date_trunc('month', current_date) + interval '1 month - 1 day')::date,
  resume_analyses_count integer NOT NULL DEFAULT 0,
  job_matches_count integer NOT NULL DEFAULT 0,
  resume_optimizations_count integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT unique_user_usage_period UNIQUE (user_id, period_start)
);

-- 4. CREATE WEBHOOK EVENTS TABLE (Idempotency protection against duplicate webhooks)
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text NOT NULL UNIQUE,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  processed boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- 5. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_payment_orders_user_id ON public.payment_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_order_id ON public.payment_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_user_usage_user_period ON public.user_usage(user_id, period_start);
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id ON public.webhook_events(event_id);

-- 6. STRICT ROW LEVEL SECURITY (RLS) POLICIES
-- Prevent users from tampering with their subscription plan tier or usage counters

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- SUBSCRIPTIONS: Users can only READ their own subscription
-- Explicitly drop client INSERT and UPDATE policies to prevent client-side plan elevation!
DROP POLICY IF EXISTS "Users can update their own subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can insert their own subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can view their own subscription" ON public.subscriptions;

CREATE POLICY "Users can view their own subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- PAYMENT ORDERS: Users can read their own order records
DROP POLICY IF EXISTS "Users can view their own payment orders" ON public.payment_orders;
CREATE POLICY "Users can view their own payment orders"
  ON public.payment_orders FOR SELECT
  USING (auth.uid() = user_id);

-- USER USAGE: Users can read their own usage counters
DROP POLICY IF EXISTS "Users can view their own usage" ON public.user_usage;
CREATE POLICY "Users can view their own usage"
  ON public.user_usage FOR SELECT
  USING (auth.uid() = user_id);

-- WEBHOOK EVENTS: No public access, strictly server-side
DROP POLICY IF EXISTS "Deny all public access to webhook events" ON public.webhook_events;
-- With RLS enabled and no policies, public clients have zero access to webhook_events.

-- 7. SECURE DATABASE FUNCTIONS (SECURITY DEFINER)
-- Only verified server-side endpoints can invoke these or service-role client

-- Helper to safely apply subscription payment
CREATE OR REPLACE FUNCTION public.apply_subscription_payment(
  p_user_id uuid,
  p_plan_tier text,
  p_provider_payment_id text,
  p_provider_subscription_id text,
  p_amount integer,
  p_currency text DEFAULT 'INR'
)
RETURNS public.subscriptions AS $$
DECLARE
  v_subscription public.subscriptions;
  v_period_start timestamptz := now();
  v_period_end timestamptz := now() + interval '30 days';
BEGIN
  INSERT INTO public.subscriptions (
    user_id,
    plan_tier,
    status,
    provider,
    provider_payment_id,
    provider_subscription_id,
    amount,
    currency,
    current_period_start,
    current_period_end,
    cancel_at_period_end,
    updated_at
  )
  VALUES (
    p_user_id,
    p_plan_tier,
    'active',
    'razorpay',
    p_provider_payment_id,
    p_provider_subscription_id,
    p_amount,
    p_currency,
    v_period_start,
    v_period_end,
    false,
    now()
  )
  ON CONFLICT (user_id) DO UPDATE
  SET
    plan_tier = EXCLUDED.plan_tier,
    status = 'active',
    provider = 'razorpay',
    provider_payment_id = EXCLUDED.provider_payment_id,
    provider_subscription_id = EXCLUDED.provider_subscription_id,
    amount = EXCLUDED.amount,
    currency = EXCLUDED.currency,
    current_period_start = v_period_start,
    current_period_end = v_period_end,
    cancel_at_period_end = false,
    updated_at = now()
  RETURNING * INTO v_subscription;

  RETURN v_subscription;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper to cancel subscription at period end
CREATE OR REPLACE FUNCTION public.cancel_user_subscription(
  p_user_id uuid
)
RETURNS public.subscriptions AS $$
DECLARE
  v_subscription public.subscriptions;
BEGIN
  UPDATE public.subscriptions
  SET
    cancel_at_period_end = true,
    updated_at = now()
  WHERE user_id = p_user_id
  RETURNING * INTO v_subscription;

  RETURN v_subscription;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper to fetch or initialize current month's usage for a user
CREATE OR REPLACE FUNCTION public.get_or_create_user_usage(
  p_user_id uuid
)
RETURNS public.user_usage AS $$
DECLARE
  v_usage public.user_usage;
  v_start date := date_trunc('month', current_date)::date;
  v_end date := (date_trunc('month', current_date) + interval '1 month - 1 day')::date;
BEGIN
  INSERT INTO public.user_usage (user_id, period_start, period_end)
  VALUES (p_user_id, v_start, v_end)
  ON CONFLICT (user_id, period_start) DO UPDATE
  SET updated_at = now()
  RETURNING * INTO v_usage;

  RETURN v_usage;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper to atomically increment usage
CREATE OR REPLACE FUNCTION public.increment_user_usage(
  p_user_id uuid,
  p_feature text -- 'resume_analyses' | 'job_matches' | 'resume_optimizations'
)
RETURNS public.user_usage AS $$
DECLARE
  v_usage public.user_usage;
  v_start date := date_trunc('month', current_date)::date;
BEGIN
  -- Ensure row exists
  PERFORM public.get_or_create_user_usage(p_user_id);

  IF p_feature = 'resume_analyses' THEN
    UPDATE public.user_usage
    SET resume_analyses_count = resume_analyses_count + 1, updated_at = now()
    WHERE user_id = p_user_id AND period_start = v_start
    RETURNING * INTO v_usage;
  ELSIF p_feature = 'job_matches' THEN
    UPDATE public.user_usage
    SET job_matches_count = job_matches_count + 1, updated_at = now()
    WHERE user_id = p_user_id AND period_start = v_start
    RETURNING * INTO v_usage;
  ELSIF p_feature = 'resume_optimizations' THEN
    UPDATE public.user_usage
    SET resume_optimizations_count = resume_optimizations_count + 1, updated_at = now()
    WHERE user_id = p_user_id AND period_start = v_start
    RETURNING * INTO v_usage;
  END IF;

  RETURN v_usage;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
