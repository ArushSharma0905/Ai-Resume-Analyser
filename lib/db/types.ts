import type { ParsedResume, AtsScoreReport } from "@/lib/types/resume";
import type { Job } from "@/lib/types/job";
import type { MatchResult } from "@/lib/types/match";
import type { ResumeOptimizationResult } from "@/lib/types/optimization";

export interface ProfileRow {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionRow {
  id: string;
  user_id: string;
  status: "active" | "inactive" | "trialing" | "canceled" | "past_due";
  plan_tier: "free" | "pro" | "premium";
  provider: string | null;
  provider_subscription_id: string | null;
  provider_customer_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export interface ResumeRow {
  id: string;
  user_id: string;
  file_name: string;
  raw_text: string | null;
  raw_text_length: number;
  file_size: number | null;
  parsed_data: ParsedResume;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface ResumeAnalysisRow {
  id: string;
  user_id: string;
  resume_id: string | null;
  overall_score: number;
  summary: string | null;
  breakdown: AtsScoreReport["breakdown"];
  key_strengths: string[];
  critical_improvements: string[];
  missing_elements: string[];
  detected_keywords: string[];
  recommended_keywords: string[];
  created_at: string;
}

export interface SavedJobRow {
  id: string;
  user_id: string;
  job_id: string;
  job_data: Job;
  notes: string | null;
  status: "saved" | "applied" | "interviewing" | "archived";
  created_at: string;
}

export interface JobMatchRow {
  id: string;
  user_id: string;
  resume_id: string | null;
  job_id: string;
  job_title: string;
  company_name: string;
  job_data: Job;
  overall_score: number;
  recommendation: string;
  match_result: MatchResult;
  created_at: string;
}

export interface ResumeOptimizationRow {
  id: string;
  user_id: string;
  resume_id: string | null;
  job_id: string | null;
  target_role: string | null;
  target_company: string | null;
  job_data: Job | null;
  match_result: MatchResult | null;
  optimization_result: ResumeOptimizationResult;
  created_at: string;
}
