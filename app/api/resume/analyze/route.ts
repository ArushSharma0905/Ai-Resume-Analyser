import { NextRequest, NextResponse } from "next/server";
import { extractTextFromBuffer } from "@/lib/parsers/extract-text";
import { analyzeResumeWithGemini } from "@/lib/ai/gemini";
import { createClient } from "@/lib/supabase/server";
import {
  getUserSubscription,
  reserveResumeAnalysis,
  releaseResumeAnalysis,
} from "@/lib/subscriptions/service";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";

    let resumeText = "";
    let sourceFileName = "Pasted Text";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      const directText = formData.get("text") as string | null;

      if (file && typeof file === "object" && file.size > 0) {
        // Size validation (10MB max)
        const MAX_SIZE = 10 * 1024 * 1024;
        if (file.size > MAX_SIZE) {
          return NextResponse.json(
            { success: false, error: "File size exceeds the 10MB limit." },
            { status: 400 }
          );
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const extraction = await extractTextFromBuffer(buffer, file.name, file.type);
        resumeText = extraction.text;
        sourceFileName = extraction.fileName;
      } else if (directText && directText.trim().length > 0) {
        resumeText = directText.trim();
        sourceFileName = "Manual Entry";
      } else {
        return NextResponse.json(
          { success: false, error: "Please upload a resume file (PDF, DOCX, TXT) or paste resume text." },
          { status: 400 }
        );
      }
    } else if (contentType.includes("application/json")) {
      const body = await request.json();
      if (!body.text || typeof body.text !== "string" || body.text.trim().length === 0) {
        return NextResponse.json(
          { success: false, error: "Missing or invalid 'text' field in request body." },
          { status: 400 }
        );
      }
      resumeText = body.text.trim();
      sourceFileName = body.fileName || "Pasted Text";
    } else {
      return NextResponse.json(
        { success: false, error: "Unsupported Content-Type. Please use multipart/form-data or application/json." },
        { status: 400 }
      );
    }

        if (resumeText.length < 50) {
      return NextResponse.json(
        {
          success: false,
          error: "The resume text is too short to perform an accurate analysis (minimum 50 characters).",
        },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------------------------
    // 2. Authenticate the user and determine the subscription tier.
    // ---------------------------------------------------------------------------
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let userId: string | null = null;

    // Try session-based auth from cookies
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.user?.id) {
      userId = session.user.id;
    } else if (user?.id) {
      userId = user.id;
    }

    // ---------------------------------------------------------------------------
    // 3. Quota handling (rolling 7-day window, enforced SERVER-SIDE).
    //
    //    - GUESTS (no userId): unchanged existing behavior — no server-side
    //      resume-analysis quota.
    //    - PRO/PREMIUM: unlimited — they bypass the free rolling quota entirely
    //      and no free-quota row is ever created for them.
    //    - FREE: atomically reserve one rolling-7-day slot via
    //      reserveResumeAnalysis() (per-user advisory lock makes this
    //      concurrency-safe) BEFORE starting the expensive AI operation.
    //      The old monthly `resume_analyses` feature quota is NOT used here.
    // ---------------------------------------------------------------------------
    let reservationId: string | null = null;
    let planTier: string = "free";

    if (userId) {
      const { planTier: tier } = await getUserSubscription(userId);
      planTier = tier;

      if (planTier === "free") {
        const reservation = await reserveResumeAnalysis(userId);

        if (!reservation.granted) {
          return NextResponse.json(
            {
              success: false,
              error: `Resume analysis limit reached. You have used ${reservation.currentUsage} of ${reservation.limit} analyses in the last 7 days.`,
              code: "RESUME_ANALYSIS_LIMIT_REACHED",
              usage: {
                currentUsage: reservation.currentUsage,
                limit: reservation.limit,
                windowDays: reservation.windowDays,
                planTier,
                nextAvailableAt: reservation.nextAvailableAt,
              },
            },
            { status: 429 }
          );
        }

        reservationId = reservation.reservationId;
      }
    }

    // ---------------------------------------------------------------------------
    // 4. Perform the AI analysis. On failure AFTER reservation, release the
    //    reservation so failed analyses never consume quota, then propagate.
    // ---------------------------------------------------------------------------
    let analysis;
    try {
      analysis = await analyzeResumeWithGemini(resumeText);
    } catch (aiErr) {
      if (userId && reservationId) {
        await releaseResumeAnalysis(userId, reservationId);
      }
      throw aiErr;
    }

    // 5. Success: the reservation row is KEPT — it now counts as one successful
    //    analysis in the rolling 7-day window and ages out of the quota on its
    //    own. (No monthly usage counter is incremented for resume analyses.)

    return NextResponse.json({
      success: true,
      data: {
        parsedResume: analysis.parsedResume,
        atsScoreReport: analysis.atsScoreReport,
        rawTextLength: resumeText.length,
        fileName: sourceFileName,
      },
    });
  } catch (error: unknown) {
    console.error("Resume analysis error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred during resume analysis.";

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
