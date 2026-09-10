import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { optimizeResumeWithGemini } from "@/lib/ai/gemini";
import { ParsedResumeSchema } from "@/lib/ai/schemas";
import type { ParsedResume } from "@/lib/types/resume";
import type { Job } from "@/lib/types/job";
import type { MatchResult } from "@/lib/types/match";
import { createClient } from "@/lib/supabase/server";
import {
  checkFeatureUsageLimit,
  reserveFeatureUsage,
  releaseFeatureUsage,
} from "@/lib/subscriptions/service";
import { PLANS } from "@/lib/subscriptions/config";

export const runtime = "nodejs";

// Lightweight Zod schema for the Job object received from the client.
const JobSchema = z.object({
  id: z.string(),
  title: z.string(),
  company: z.string(),
  location: z.string(),
  isRemote: z.boolean(),
  salaryMin: z.number().nullable().optional(),
  salaryMax: z.number().nullable().optional(),
  salaryCurrency: z.string().nullable().optional(),
  salaryPeriod: z.string().nullable().optional(),
  employmentType: z.string(),
  experienceLevel: z.string().nullable().optional(),
  description: z.string(),
  postedDate: z.string().nullable().optional(),
  applicationUrl: z.string(),
  tags: z.array(z.string()).optional(),
  provider: z.string(),
});

// MatchResult is optional — optimization can work without it.
const MatchResultSchema = z.object({
  overallScore: z.number().int().min(0).max(100),
  recommendation: z.string(),
  summary: z.string(),
  matchedSkills: z.array(z.string()),
  missingSkills: z.array(z.string()),
  transferableSkills: z.array(z.string()),
  experienceFit: z.string(),
  educationFit: z.string(),
  seniorityFit: z.string(),
  strengths: z.array(z.string()),
  concerns: z.array(z.string()),
  interviewPreparation: z.array(z.string()),
  confidence: z.enum(["low", "medium", "high"]),
});

// Request body schema: resume + job + optional matchResult
const ResumeOptimizeRequestSchema = z.object({
  resume: ParsedResumeSchema,
  job: JobSchema,
  matchResult: MatchResultSchema.optional().nullable(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate the request body with Zod
    const validated = ResumeOptimizeRequestSchema.safeParse(body);

    if (!validated.success) {
      const issues = validated.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join(", ");
      return NextResponse.json(
        {
          success: false,
          error: `Invalid request body: ${issues}`,
        },
        { status: 400 }
      );
    }

        const { resume, job, matchResult } = validated.data as {
      resume: ParsedResume;
      job: Job;
      matchResult?: MatchResult | null;
    };

    // Server-side usage limit check for resume_optimizations
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let userId: string | null = null;

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.user?.id) {
      userId = session.user.id;
    } else if (user?.id) {
      userId = user.id;
    }

    const usageResult = await checkFeatureUsageLimit(
      userId,
      "resume_optimizations"
    );

    if (!usageResult.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: usageResult.error || "Usage limit exceeded",
          code: usageResult.reason || "LIMIT_EXCEEDED",
          usage: {
            currentUsage: usageResult.currentUsage,
            limit: usageResult.limit,
            planTier: usageResult.planTier,
          },
        },
        { status: 429 }
      );
    }

    // Atomically reserve a usage credit BEFORE the AI call. This replaces the
    // previous TOCTOU pattern (check then separate increment) with a single
    // PostgreSQL transaction (reserve_feature_usage RPC with row locking),
    // so concurrent requests cannot collectively exceed the plan limit.
    if (userId) {
      const planLimit =
        PLANS[usageResult.planTier]?.limits.resume_optimizations ?? 0;
      const reservation = await reserveFeatureUsage(
        userId,
        "resume_optimizations",
        planLimit
      );

      if (!reservation.granted) {
        return NextResponse.json(
          {
            success: false,
            error: reservation.error || "Usage limit exceeded",
            code: reservation.reason || "LIMIT_EXCEEDED",
            usage: {
              currentUsage: reservation.currentUsage,
              limit: reservation.limit,
              planTier: usageResult.planTier,
            },
          },
          { status: 429 }
        );
      }
    }

    // Call Gemini to generate optimization suggestions.
    // On AI failure the reserved credit is released, so failed operations
    // never consume quota; the error propagates to the outer handler (which
    // maps Gemini quota errors to the 429 QUOTA_ERROR response).
    let optimization;
    try {
      optimization = await optimizeResumeWithGemini(resume, job, matchResult);
    } catch (aiErr) {
      if (userId) {
        await releaseFeatureUsage(userId, "resume_optimizations");
      }
      throw aiErr;
    }

    // Usage credit was atomically reserved above and the AI call succeeded.

    return NextResponse.json({
      success: true,
      data: optimization,
    });
  } catch (error: unknown) {
    console.error("Resume optimize API error:", error);

    // Detect Gemini quota / rate-limit errors so the UI can show a targeted message
    const statusCode =
      error instanceof Error &&
      (error.message.includes("429") ||
        error.message.includes("RESOURCE_EXHAUSTED") ||
        error.message.includes("quota"))
        ? 429
        : 500;

    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred during resume optimization.";

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        code: statusCode === 429 ? "QUOTA_ERROR" : "INTERNAL_ERROR",
      },
      { status: statusCode }
    );
  }
}