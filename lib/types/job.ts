export type EmploymentType =
  | "full-time"
  | "part-time"
  | "contract"
  | "internship"
  | "temporary"
  | "other";

export type ExperienceLevel =
  | "entry"
  | "mid"
  | "senior"
  | "lead"
  | "executive"
  | "all";

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  isRemote: boolean;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency?: string | null;
  salaryPeriod?: "year" | "month" | "hour" | null;
  employmentType: EmploymentType | string;
  experienceLevel?: ExperienceLevel | string | null;
  description: string;
  postedDate?: string | null; // ISO string
  applicationUrl: string;
  tags?: string[];
  provider: string; // e.g. 'jsearch', 'mock'
}

export interface JobSearchFilters {
  query?: string;
  location?: string;
  /** Optional explicit country (e.g. "India" / "in"). When absent, the
   *  provider infers India from the location/query text. Additive — the API
   *  and UI keep working without it. */
  country?: string;
  isRemote?: boolean;
  employmentType?: EmploymentType | "all";
  experienceLevel?: ExperienceLevel | "all";
  page?: number;
  pageSize?: number;
}

export interface JobSearchResult {
  jobs: Job[];
  totalJobs: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  provider: string;
}

export interface JobProvider {
  readonly name: string;
  search(filters: JobSearchFilters): Promise<JobSearchResult>;
}
