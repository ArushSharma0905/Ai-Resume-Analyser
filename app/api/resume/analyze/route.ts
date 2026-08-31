import { NextRequest, NextResponse } from "next/server";
import { extractTextFromBuffer } from "@/lib/parsers/extract-text";
import { analyzeResumeWithGemini } from "@/lib/ai/gemini";

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

    // Call Gemini with structured output and Zod validation
    const analysis = await analyzeResumeWithGemini(resumeText);

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
