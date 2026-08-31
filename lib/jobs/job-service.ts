import {
  JobProvider,
  JobSearchFilters,
  JobSearchResult,
} from "@/lib/types/job";
import { MockJobProvider } from "./providers/mock-provider";
import { AdzunaJobProvider } from "./providers/adzuna-provider";

/**
 * Centralized Job Service
 * ------------------------
 * Decouples the application from specific job listing APIs.
 * Supports swappable providers (Mock, Adzuna, etc.) via configuration.
 */
class JobService {
  private mockProvider: MockJobProvider;
  private adzunaProvider: AdzunaJobProvider;

  constructor() {
    this.mockProvider = new MockJobProvider();
    this.adzunaProvider = new AdzunaJobProvider();
  }

  /**
   * Resolves the active job provider based on environment configuration.
   */
  getProvider(): JobProvider {
    const configuredProvider = process.env.JOB_PROVIDER?.toLowerCase();

    if (configuredProvider === "adzuna") {
      if (this.adzunaProvider.isConfigured()) {
        return this.adzunaProvider;
      }
      console.warn(
        "JOB_PROVIDER is set to 'adzuna' but credentials are not configured. Falling back to Mock provider."
      );
    }

    return this.mockProvider;
  }

  /**
   * Executes a job search using the active provider.
   */
  async searchJobs(filters: JobSearchFilters): Promise<JobSearchResult> {
    const provider = this.getProvider();
    try {
      return await provider.search(filters);
    } catch (err: unknown) {
      // If the primary provider fails, try falling back to mock provider in development
      if (provider.name !== "mock") {
        console.error(`Primary provider '${provider.name}' failed. Falling back to mock provider:`, err);
        return await this.mockProvider.search(filters);
      }
      throw err;
    }
  }
}

export const jobService = new JobService();
