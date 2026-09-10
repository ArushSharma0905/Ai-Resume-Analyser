import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { matchResumeWithJob } from "@/lib/ai/gemini";
import { ParsedResumeSchema } from "@/lib/ai/schemas";
import type { ParsedResume } from "@/lib/types/resume";
import type { Job } from "@/lib/types/job";
import { createClient } from "@/lib/supabase/server";
import {
  checkFeatureUsageLimit,
  reserveFeatureUsage,
  releaseFeatureUsage,
} from "@/lib/subscriptions/service";
import { PLANS } from "@/lib/subscriptions/config";

export const runtime = "nodejs";

// Lightweight Zod schema for the Job object received from the client.
// We validate the essential fields needed for matching; extra fields are allowed.
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

// Request body schema: resume + job
const JobMatchRequestSchema = z.object({
  resume: ParsedResumeSchema,
  job: JobSchema,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate the request body with Zod
    const validated = JobMatchRequestSchema.safeParse(body);

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

        const { resume, job } = validated.data as {
      resume: ParsedResume;
      job: Job;
    };

    // Server-side usage limit check for job_matches
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

    const usageResult = await checkFeatureUsageLimit(userId, "job_matches");

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
      const planLimit = PLANS[usageResult.planTier]?.limits.job_matches ?? 0;
      const reservation = await reserveFeatureUsage(
        userId,
        "job_matches",
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

    // Call Gemini to perform the match.
    // On AI failure the reserved credit is released, so failed operations
    // never consume quota; the error propagates to the outer handler.
    let matchResult;
    try {
      matchResult = await matchResumeWithJob(resume, job);
    } catch (aiErr) {
      if (userId) {
        await releaseFeatureUsage(userId, "job_matches");
      }
      throw aiErr;
    }

    // Usage credit was atomically reserved above and the AI call succeeded.

    return NextResponse.json({
      success: true,
      data: matchResult,
    });
  } catch (error: unknown) {
    console.error("Job match API error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred during job matching.";

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
