import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { matchResumeWithJob } from "@/lib/ai/gemini";
import { ParsedResumeSchema } from "@/lib/ai/schemas";
import type { ParsedResume } from "@/lib/types/resume";
import type { Job } from "@/lib/types/job";

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

    // Call Gemini to perform the match
    const matchResult = await matchResumeWithJob(resume, job);

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
