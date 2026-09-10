import { NextRequest, NextResponse } from "next/server";
import { jobService } from "@/lib/jobs/job-service";
import { JobSearchFilters, EmploymentType, ExperienceLevel } from "@/lib/types/job";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const query = searchParams.get("query") || searchParams.get("q") || undefined;
    const location = searchParams.get("location") || undefined;
    const country = searchParams.get("country")?.trim() || undefined;
    const remoteParam = searchParams.get("remote");
    const isRemote =
      remoteParam === "true" || remoteParam === "1"
        ? true
        : remoteParam === "false" || remoteParam === "0"
        ? false
        : undefined;

    const employmentType = (searchParams.get("jobType") ||
      searchParams.get("employmentType") ||
      "all") as EmploymentType | "all";

    const experienceLevel = (searchParams.get("experienceLevel") ||
      "all") as ExperienceLevel | "all";

    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "6", 10);

    const filters: JobSearchFilters = {
      query,
      location,
      country,
      isRemote,
      employmentType,
      experienceLevel,
      page: isNaN(page) ? 1 : page,
      pageSize: isNaN(pageSize) ? 6 : pageSize,
    };

    const result = await jobService.searchJobs(filters);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
    console.error("Job search API error:", error);
    const msg = error instanceof Error ? error.message : "Failed to search jobs.";
    return NextResponse.json(
      {
        success: false,
        error: msg,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const filters: JobSearchFilters = {
      query: body.query || undefined,
      location: body.location || undefined,
      country: typeof body.country === "string" ? body.country.trim() || undefined : undefined,
      isRemote: typeof body.isRemote === "boolean" ? body.isRemote : undefined,
      employmentType: body.employmentType || "all",
      experienceLevel: body.experienceLevel || "all",
      page: typeof body.page === "number" ? body.page : 1,
      pageSize: typeof body.pageSize === "number" ? body.pageSize : 6,
    };

    const result = await jobService.searchJobs(filters);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
    console.error("Job search API error:", error);
    const msg = error instanceof Error ? error.message : "Failed to search jobs.";
    return NextResponse.json(
      {
        success: false,
        error: msg,
      },
      { status: 500 }
    );
  }
}
