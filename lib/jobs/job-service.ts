import {
  JobProvider,
  JobSearchFilters,
  JobSearchResult,
} from "@/lib/types/job";
import { MockJobProvider } from "./providers/mock-provider";
import { JSearchJobProvider } from "./providers/jsearch-provider";

/**
 * Centralized Job Service
 * ------------------------
 * Decouples the application from specific job listing APIs.
 *
 * Provider selection (JOB_PROVIDER environment variable):
 * - "jsearch"  -> JSearchJobProvider (production provider, real-time listings)
 * - "mock"     -> MockJobProvider (explicit local development/testing ONLY)
 * - (unset)    -> mock provider in local development; hard error in production
 *
 * Mock policy (important):
 * - The mock provider is NEVER used as a fallback for a failing real provider.
 *   Provider errors propagate to the API route and are returned to the client
 *   as a proper error response.
 * - In production (NODE_ENV=production), any missing/invalid provider
 *   configuration — including an explicit "mock" selection — throws a
 *   configuration error instead of silently serving fake jobs.
 */
class JobService {
  private mockProvider: MockJobProvider;
  private jsearchProvider: JSearchJobProvider;

  constructor() {
    this.mockProvider = new MockJobProvider();
    this.jsearchProvider = new JSearchJobProvider();
  }

  private isProduction(): boolean {
    return process.env.NODE_ENV === "production";
  }

  /**
   * Resolves the active job provider based on environment configuration.
   * Throws in production when configuration is missing or invalid.
   */
  getProvider(): JobProvider {
    const configuredProvider = process.env.JOB_PROVIDER?.toLowerCase().trim();

    if (configuredProvider === "jsearch") {
      if (this.jsearchProvider.isConfigured()) {
        return this.jsearchProvider;
      }
      if (this.isProduction()) {
        throw new Error(
          "JOB_PROVIDER is set to 'jsearch' but JSEARCH_API_KEY is not configured. " +
            "Add JSEARCH_API_KEY (your RapidAPI key for the JSearch API) to the production environment."
        );
      }
      console.warn(
        "JOB_PROVIDER is set to 'jsearch' but JSEARCH_API_KEY is not configured. " +
          "Falling back to the mock provider for local development only — " +
          "set JSEARCH_API_KEY in .env.local to enable live job data."
      );
      return this.mockProvider;
    }

    if (configuredProvider === "mock") {
      if (this.isProduction()) {
        throw new Error(
          "JOB_PROVIDER is set to 'mock', but the mock provider is not allowed in production. " +
            "Set JOB_PROVIDER=jsearch with a valid JSEARCH_API_KEY."
        );
      }
      return this.mockProvider;
    }

    if (!configuredProvider) {
      if (this.isProduction()) {
        throw new Error(
          "JOB_PROVIDER is not configured. Set JOB_PROVIDER=jsearch and JSEARCH_API_KEY " +
            "in the environment (mock jobs are never served in production)."
        );
      }
      console.warn(
        "JOB_PROVIDER is not set. Defaulting to the mock provider for local development."
      );
      return this.mockProvider;
    }

    // Unknown provider value (e.g. the removed "adzuna").
    if (this.isProduction()) {
      throw new Error(
        `Unknown JOB_PROVIDER '${configuredProvider}'. Supported values: jsearch (production) or mock (local development only).`
      );
    }
    console.warn(
      `Unknown JOB_PROVIDER '${configuredProvider}'. Falling back to the mock provider for local development.`
    );
    return this.mockProvider;
  }

  /**
   * Executes a job search using the active provider.
   *
   * NOTE: There is intentionally NO fallback to the mock provider. If the
   * active provider fails (network error, auth failure, rate limit, bad data),
   * the error propagates so the API route can return a proper error response.
   */
  async searchJobs(filters: JobSearchFilters): Promise<JobSearchResult> {
    const provider = this.getProvider();
    return await provider.search(filters);
  }
}

export const jobService = new JobService();
