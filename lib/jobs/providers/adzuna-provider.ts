import {
  Job,
  JobProvider,
  JobSearchFilters,
  JobSearchResult,
} from "@/lib/types/job";

interface AdzunaRawJob {
  id?: string | number;
  title?: string;
  company?: { display_name?: string };
  location?: { display_name?: string };
  salary_min?: number;
  salary_max?: number;
  contract_time?: string;
  description?: string;
  created?: string;
  redirect_url?: string;
  category?: { label?: string };
}

/**
 * ADZUNA JOB PROVIDER
 * -------------------
 * Production provider integrating with the Adzuna Jobs API.
 * Requires `ADZUNA_APP_ID` and `ADZUNA_APP_KEY` in environment variables.
 * If credentials are not set, falls back with a descriptive error so the Mock provider can take over.
 */
export class AdzunaJobProvider implements JobProvider {
  readonly name = "adzuna";
  private appId?: string;
  private appKey?: string;
  private country: string;

  constructor() {
    this.appId = process.env.ADZUNA_APP_ID;
    this.appKey = process.env.ADZUNA_APP_KEY;
    this.country = process.env.ADZUNA_COUNTRY || "us";
  }

  isConfigured(): boolean {
    return Boolean(this.appId && this.appKey);
  }

  async search(filters: JobSearchFilters): Promise<JobSearchResult> {
    if (!this.appId || !this.appKey) {
      throw new Error(
        "Adzuna API credentials (ADZUNA_APP_ID, ADZUNA_APP_KEY) are not configured. Please set them in your .env.local file or use the mock provider."
      );
    }

    const page = Math.max(1, filters.page || 1);
    const pageSize = Math.max(1, Math.min(50, filters.pageSize || 10));

    const params = new URLSearchParams({
      app_id: this.appId,
      app_key: this.appKey,
      results_per_page: pageSize.toString(),
      content_type: "application/json",
    });

    if (filters.query) {
      params.append("what", filters.query);
    }

    if (filters.location) {
      params.append("where", filters.location);
    }

    if (filters.isRemote) {
      // Adzuna supports 'what' query modification or description search
      params.append("what_phrase", "remote");
    }

    if (filters.employmentType && filters.employmentType !== "all") {
      if (filters.employmentType === "full-time") {
        params.append("full_time", "1");
      } else if (filters.employmentType === "part-time") {
        params.append("part_time", "1");
      } else if (filters.employmentType === "contract") {
        params.append("contract", "1");
      }
    }

    const url = `https://api.adzuna.com/v1/api/jobs/${this.country}/search/${page}?${params.toString()}`;

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Adzuna API returned HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const rawResults = Array.isArray(data.results) ? data.results : [];
    const totalJobs = typeof data.count === "number" ? data.count : rawResults.length;
    const totalPages = Math.ceil(totalJobs / pageSize) || 1;

    // Normalize raw Adzuna records into our internal Job interface
    const normalizedJobs: Job[] = rawResults.map((item: AdzunaRawJob, idx: number) => {
      const isRemoteCheck =
        item.title?.toLowerCase().includes("remote") ||
        item.description?.toLowerCase().includes("remote") ||
        item.location?.display_name?.toLowerCase().includes("remote");

      return {
        id: item.id ? String(item.id) : `adzuna-${idx}-${Date.now()}`,
        title: item.title ? item.title.replace(/<\/?[^>]+(>|$)/g, "") : "Untitled Position",
        company: item.company?.display_name || "Company Confidential",
        location: item.location?.display_name || "Location Unspecified",
        isRemote: Boolean(isRemoteCheck),
        salaryMin: typeof item.salary_min === "number" ? Math.round(item.salary_min) : null,
        salaryMax: typeof item.salary_max === "number" ? Math.round(item.salary_max) : null,
        salaryCurrency: this.country === "us" ? "USD" : this.country === "gb" ? "GBP" : "EUR",
        salaryPeriod: "year",
        employmentType: item.contract_time === "full_time" ? "full-time" : item.contract_time === "part_time" ? "part-time" : "other",
        experienceLevel: null,
        description: item.description ? item.description.replace(/<\/?[^>]+(>|$)/g, "").slice(0, 300) : "No description provided.",
        postedDate: item.created || null,
        applicationUrl: item.redirect_url || "https://www.adzuna.com",
        tags: item.category?.label ? [item.category.label] : [],
        provider: "adzuna",
      };
    });

    return {
      jobs: normalizedJobs,
      totalJobs,
      currentPage: page,
      totalPages,
      pageSize,
      provider: this.name,
    };
  }
}
