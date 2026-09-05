-- ==============================================================================
-- PHASE 6: SUPABASE DATABASE SCHEMA & ROW LEVEL SECURITY (RLS)
-- AI Resume Analyzer & ATS Career Intelligence Platform
-- ==============================================================================
-- Instructions:
-- 1. Open your Supabase project dashboard: https://supabase.com/dashboard
-- 2. Go to the "SQL Editor" tab from the left sidebar.
-- 3. Click "New Query", paste the entire contents of this file, and click "Run".
-- 4. All tables, foreign key constraints, indexes, triggers, and RLS policies
--    will be created safely (using IF NOT EXISTS / CREATE OR REPLACE).
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. EXTENSIONS
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 2. PROFILES TABLE (Public profile synced with auth.users)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- ------------------------------------------------------------------------------
-- 3. SUBSCRIPTIONS TABLE (Structure for Phase 7 Stripe/Payment Integration)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active', -- 'active', 'inactive', 'trialing', 'canceled', 'past_due'
  plan_tier text NOT NULL DEFAULT 'free', -- 'free', 'pro', 'premium'
  provider text, -- 'stripe', 'razorpay', etc.
  provider_subscription_id text,
  provider_customer_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT unique_user_subscription UNIQUE (user_id)
);

-- ------------------------------------------------------------------------------
-- 4. RESUMES TABLE (Stores user-uploaded resumes and parsed JSON)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.resumes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  raw_text text,
  raw_text_length integer DEFAULT 0,
  file_size integer,
  parsed_data jsonb NOT NULL,
  is_primary boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- ------------------------------------------------------------------------------
-- 5. RESUME ANALYSES TABLE (ATS Scorecards and Gemini Diagnostics)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.resume_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resume_id uuid REFERENCES public.resumes(id) ON DELETE CASCADE,
  overall_score integer NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
  summary text,
  breakdown jsonb NOT NULL,
  key_strengths text[] DEFAULT '{}'::text[],
  critical_improvements text[] DEFAULT '{}'::text[],
  missing_elements text[] DEFAULT '{}'::text[],
  detected_keywords text[] DEFAULT '{}'::text[],
  recommended_keywords text[] DEFAULT '{}'::text[],
  created_at timestamptz DEFAULT now() NOT NULL
);

-- ------------------------------------------------------------------------------
-- 6. SAVED JOBS TABLE (Bookmarked job listings for users)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.saved_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id text NOT NULL,
  job_data jsonb NOT NULL,
  notes text,
  status text DEFAULT 'saved', -- 'saved', 'applied', 'interviewing', 'archived'
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT unique_user_saved_job UNIQUE (user_id, job_id)
);

-- ------------------------------------------------------------------------------
-- 7. JOB MATCHES TABLE (Compatibility assessments between resume and jobs)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.job_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resume_id uuid REFERENCES public.resumes(id) ON DELETE SET NULL,
  job_id text NOT NULL,
  job_title text NOT NULL,
  company_name text NOT NULL,
  job_data jsonb NOT NULL,
  overall_score integer NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
  recommendation text NOT NULL,
  match_result jsonb NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- ------------------------------------------------------------------------------
-- 8. RESUME OPTIMIZATIONS TABLE (Targeted non-hallucinatory rewrites)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.resume_optimizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resume_id uuid REFERENCES public.resumes(id) ON DELETE SET NULL,
  job_id text,
  target_role text,
  target_company text,
  job_data jsonb,
  match_result jsonb,
  optimization_result jsonb NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- ------------------------------------------------------------------------------
-- 9. PERFORMANCE INDEXES
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON public.resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_resumes_created_at ON public.resumes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_resume_analyses_user_id ON public.resume_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_resume_analyses_resume_id ON public.resume_analyses(resume_id);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_user_id ON public.saved_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_job_matches_user_id ON public.job_matches(user_id);
CREATE INDEX IF NOT EXISTS idx_job_matches_created_at ON public.job_matches(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_resume_optimizations_user_id ON public.resume_optimizations(user_id);
CREATE INDEX IF NOT EXISTS idx_resume_optimizations_created_at ON public.resume_optimizations(created_at DESC);

-- ------------------------------------------------------------------------------
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- Strict Isolation: Users may ONLY access their own records
-- ------------------------------------------------------------------------------

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_optimizations ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Subscriptions policies
DROP POLICY IF EXISTS "Users can view their own subscription" ON public.subscriptions;
CREATE POLICY "Users can view their own subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own subscription" ON public.subscriptions;
CREATE POLICY "Users can update their own subscription"
  ON public.subscriptions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own subscription" ON public.subscriptions;
CREATE POLICY "Users can insert their own subscription"
  ON public.subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Resumes policies
DROP POLICY IF EXISTS "Users can view their own resumes" ON public.resumes;
CREATE POLICY "Users can view their own resumes"
  ON public.resumes FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own resumes" ON public.resumes;
CREATE POLICY "Users can insert their own resumes"
  ON public.resumes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own resumes" ON public.resumes;
CREATE POLICY "Users can update their own resumes"
  ON public.resumes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own resumes" ON public.resumes;
CREATE POLICY "Users can delete their own resumes"
  ON public.resumes FOR DELETE
  USING (auth.uid() = user_id);

-- Resume Analyses policies
DROP POLICY IF EXISTS "Users can view their own resume analyses" ON public.resume_analyses;
CREATE POLICY "Users can view their own resume analyses"
  ON public.resume_analyses FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own resume analyses" ON public.resume_analyses;
CREATE POLICY "Users can insert their own resume analyses"
  ON public.resume_analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own resume analyses" ON public.resume_analyses;
CREATE POLICY "Users can delete their own resume analyses"
  ON public.resume_analyses FOR DELETE
  USING (auth.uid() = user_id);

-- Saved Jobs policies
DROP POLICY IF EXISTS "Users can view their own saved jobs" ON public.saved_jobs;
CREATE POLICY "Users can view their own saved jobs"
  ON public.saved_jobs FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own saved jobs" ON public.saved_jobs;
CREATE POLICY "Users can insert their own saved jobs"
  ON public.saved_jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own saved jobs" ON public.saved_jobs;
CREATE POLICY "Users can update their own saved jobs"
  ON public.saved_jobs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own saved jobs" ON public.saved_jobs;
CREATE POLICY "Users can delete their own saved jobs"
  ON public.saved_jobs FOR DELETE
  USING (auth.uid() = user_id);

-- Job Matches policies
DROP POLICY IF EXISTS "Users can view their own job matches" ON public.job_matches;
CREATE POLICY "Users can view their own job matches"
  ON public.job_matches FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own job matches" ON public.job_matches;
CREATE POLICY "Users can insert their own job matches"
  ON public.job_matches FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own job matches" ON public.job_matches;
CREATE POLICY "Users can delete their own job matches"
  ON public.job_matches FOR DELETE
  USING (auth.uid() = user_id);

-- Resume Optimizations policies
DROP POLICY IF EXISTS "Users can view their own resume optimizations" ON public.resume_optimizations;
CREATE POLICY "Users can view their own resume optimizations"
  ON public.resume_optimizations FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own resume optimizations" ON public.resume_optimizations;
CREATE POLICY "Users can insert their own resume optimizations"
  ON public.resume_optimizations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own resume optimizations" ON public.resume_optimizations;
CREATE POLICY "Users can delete their own resume optimizations"
  ON public.resume_optimizations FOR DELETE
  USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 11. AUTOMATIC TIMESTAMPS AND USER CREATION TRIGGERS
-- ------------------------------------------------------------------------------

-- Trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER set_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_resumes_updated_at ON public.resumes;
CREATE TRIGGER set_resumes_updated_at
  BEFORE UPDATE ON public.resumes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Trigger function to automatically create public.profiles and default public.subscriptions on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    full_name = CASE WHEN EXCLUDED.full_name <> '' THEN EXCLUDED.full_name ELSE public.profiles.full_name END;

  INSERT INTO public.subscriptions (user_id, plan_tier, status)
  VALUES (
    NEW.id,
    'free',
    'active'
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to execute on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
