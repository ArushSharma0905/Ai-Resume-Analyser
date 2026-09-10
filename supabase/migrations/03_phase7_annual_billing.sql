-- ==============================================================================
-- PHASE 7.1: ANNUAL BILLING SUPPORT (Additive, Non-Destructive)
-- Adds billing_interval to subscriptions & payment_orders, and extends
-- apply_subscription_payment to grant 365-day periods for annual payments.
-- ==============================================================================
-- Safe to run multiple times. Does NOT drop tables, delete data, or alter RLS.
-- Existing subscribers default to 'monthly' and remain fully valid.
-- ==============================================================================

-- 1. SUBSCRIPTIONS: add billing_interval (defaults to 'monthly' for existing rows)
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS billing_interval text NOT NULL DEFAULT 'monthly';

-- Enforce allowed values
ALTER TABLE public.subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_billing_interval_check;
ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_billing_interval_check
  CHECK (billing_interval IN ('monthly', 'annual'));

-- 2. PAYMENT ORDERS: normalize the billing interval column name.
-- The Phase 7 migration created this as billing_cycle; rename it to
-- billing_interval for a single consistent name across tables.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'payment_orders'
      AND column_name = 'billing_cycle'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'payment_orders'
      AND column_name = 'billing_interval'
  ) THEN
    ALTER TABLE public.payment_orders RENAME COLUMN billing_cycle TO billing_interval;
  END IF;
END $$;

-- In case payment_orders does not exist yet or was created without the column
ALTER TABLE public.payment_orders
  ADD COLUMN IF NOT EXISTS billing_interval text NOT NULL DEFAULT 'monthly';

ALTER TABLE public.payment_orders
  DROP CONSTRAINT IF EXISTS payment_orders_billing_interval_check;
ALTER TABLE public.payment_orders
  ADD CONSTRAINT payment_orders_billing_interval_check
  CHECK (billing_interval IN ('monthly', 'annual'));

-- 3. BACKFILL: ensure every existing subscription row has a concrete interval.
-- NOT NULL DEFAULT 'monthly' already handles this; kept as explicit safety.
UPDATE public.subscriptions
SET billing_interval = 'monthly'
WHERE billing_interval IS NULL
   OR billing_interval NOT IN ('monthly', 'annual');

UPDATE public.payment_orders
SET billing_interval = 'monthly'
WHERE billing_interval IS NULL
   OR billing_interval NOT IN ('monthly', 'annual');

-- 4. EXTEND apply_subscription_payment to be billing-interval aware.
-- Replaces the Phase 7 function in place (same behavior for monthly).
CREATE OR REPLACE FUNCTION public.apply_subscription_payment(
  p_user_id uuid,
  p_plan_tier text,
  p_provider_payment_id text,
  p_provider_subscription_id text,
  p_amount integer,
  p_currency text DEFAULT 'INR',
  p_billing_interval text DEFAULT 'monthly'
)
RETURNS public.subscriptions AS $$
DECLARE
  v_subscription public.subscriptions;
  v_period_start timestamptz := now();
  v_period_end timestamptz;
  v_interval text := 'monthly';
BEGIN
  -- Server-side validation of the billing interval (never trust client input)
  IF p_billing_interval = 'annual' THEN
    v_interval := 'annual';
  END IF;

  IF v_interval = 'annual' THEN
    v_period_end := now() + interval '365 days';
  ELSE
    v_period_end := now() + interval '30 days';
  END IF;

  INSERT INTO public.subscriptions (
    user_id,
    plan_tier,
    status,
    provider,
    provider_payment_id,
    provider_subscription_id,
    amount,
    currency,
    billing_interval,
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
    v_interval,
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
    billing_interval = EXCLUDED.billing_interval,
    current_period_start = v_period_start,
    current_period_end = v_period_end,
    cancel_at_period_end = false,
    updated_at = now()
  RETURNING * INTO v_subscription;

  RETURN v_subscription;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS is intentionally left untouched: still enabled on all tables,
-- no new public policies introduced by this migration.
