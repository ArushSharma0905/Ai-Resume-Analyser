import {
  Job,
  JobProvider,
  JobSearchFilters,
  JobSearchResult,
} from "@/lib/types/job";

/**
 * MOCK JOB PROVIDER
 * -----------------
 * Clearly isolated mock data for development and testing of search & UI features.
 * All listings are explicitly marked with "[TEST / MOCK]" to prevent any confusion with live jobs.
 */
const MOCK_DATABASE: Job[] = [
  {
    id: "mock-job-1",
    title: "Senior Full-Stack Engineer [TEST / MOCK]",
    company: "DevFlow Systems [Demo]",
    location: "San Francisco, CA",
    isRemote: true,
    salaryMin: 145000,
    salaryMax: 185000,
    salaryCurrency: "USD",
    salaryPeriod: "year",
    employmentType: "full-time",
    experienceLevel: "senior",
    description:
      "[DEMO LISTING] We are looking for a Senior Full-Stack Engineer with deep experience in TypeScript, React, Next.js, and Node.js to architect high-performance SaaS applications and microservices.",
    postedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    applicationUrl: "https://example.com/demo-jobs/senior-fullstack",
    tags: ["TypeScript", "React", "Next.js", "Node.js", "PostgreSQL", "AWS"],
    provider: "mock",
  },
  {
    id: "mock-job-2",
    title: "Frontend Engineer (React / Next.js) [TEST / MOCK]",
    company: "PixelCraft Labs [Demo]",
    location: "New York, NY",
    isRemote: true,
    salaryMin: 120000,
    salaryMax: 150000,
    salaryCurrency: "USD",
    salaryPeriod: "year",
    employmentType: "full-time",
    experienceLevel: "mid",
    description:
      "[DEMO LISTING] Seeking a creative Frontend Engineer to build interactive client-facing dashboards using React 19, Tailwind CSS, TypeScript, and modern state management patterns.",
    postedDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    applicationUrl: "https://example.com/demo-jobs/frontend-react",
    tags: ["React", "TypeScript", "Tailwind CSS", "Next.js", "GraphQL"],
    provider: "mock",
  },
  {
    id: "mock-job-3",
    title: "Lead Backend Developer (Node.js & Go) [TEST / MOCK]",
    company: "CloudVortex Infra [Demo]",
    location: "Seattle, WA",
    isRemote: false,
    salaryMin: 160000,
    salaryMax: 205000,
    salaryCurrency: "USD",
    salaryPeriod: "year",
    employmentType: "full-time",
    experienceLevel: "lead",
    description:
      "[DEMO LISTING] Lead a distributed backend team building resilient distributed systems, Redis caching layers, and high-throughput PostgreSQL databases.",
    postedDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    applicationUrl: "https://example.com/demo-jobs/lead-backend",
    tags: ["Node.js", "Go", "PostgreSQL", "Redis", "Docker", "Kubernetes"],
    provider: "mock",
  },
  {
    id: "mock-job-4",
    title: "AI / ML Solutions Engineer [TEST / MOCK]",
    company: "NeuralMatrix AI [Demo]",
    location: "Austin, TX",
    isRemote: true,
    salaryMin: 150000,
    salaryMax: 190000,
    salaryCurrency: "USD",
    salaryPeriod: "year",
    employmentType: "full-time",
    experienceLevel: "senior",
    description:
      "[DEMO LISTING] Join our applied AI team to deploy LLM pipelines, RAG systems, and multimodal generative AI capabilities using Python, LangChain, and vector embeddings.",
    postedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    applicationUrl: "https://example.com/demo-jobs/ai-ml-engineer",
    tags: ["Python", "Gemini", "PyTorch", "LangChain", "Vector DB", "FastAPI"],
    provider: "mock",
  },
  {
    id: "mock-job-5",
    title: "DevOps & Cloud Infrastructure Engineer [TEST / MOCK]",
    company: "Apex Scale Partners [Demo]",
    location: "Chicago, IL",
    isRemote: true,
    salaryMin: 130000,
    salaryMax: 165000,
    salaryCurrency: "USD",
    salaryPeriod: "year",
    employmentType: "full-time",
    experienceLevel: "mid",
    description:
      "[DEMO LISTING] Architect and automate CI/CD pipelines, container orchestration with Kubernetes, and Terraform infrastructure-as-code across AWS and GCP.",
    postedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    applicationUrl: "https://example.com/demo-jobs/devops-cloud",
    tags: ["AWS", "Docker", "Kubernetes", "Terraform", "CI/CD", "GitHub Actions"],
    provider: "mock",
  },
  {
    id: "mock-job-6",
    title: "Junior Full-Stack Web Developer [TEST / MOCK]",
    company: "HyperLaunch Studio [Demo]",
    location: "Boston, MA",
    isRemote: true,
    salaryMin: 75000,
    salaryMax: 95000,
    salaryCurrency: "USD",
    salaryPeriod: "year",
    employmentType: "full-time",
    experienceLevel: "entry",
    description:
      "[DEMO LISTING] Great entry-level opportunity for an ambitious junior developer eager to build web features in React, Node.js, and SQL under senior mentorship.",
    postedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    applicationUrl: "https://example.com/demo-jobs/junior-fullstack",
    tags: ["JavaScript", "TypeScript", "React", "Node.js", "HTML/CSS"],
    provider: "mock",
  },
  {
    id: "mock-job-7",
    title: "Contract React Native Mobile Developer [TEST / MOCK]",
    company: "AppSphere Media [Demo]",
    location: "Remote, Global",
    isRemote: true,
    salaryMin: 65,
    salaryMax: 90,
    salaryCurrency: "USD",
    salaryPeriod: "hour",
    employmentType: "contract",
    experienceLevel: "senior",
    description:
      "[DEMO LISTING] 6-month contract for a seasoned React Native specialist to build cross-platform iOS and Android features with offline-first sync.",
    postedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    applicationUrl: "https://example.com/demo-jobs/contract-react-native",
    tags: ["React Native", "TypeScript", "iOS", "Android", "Redux"],
    provider: "mock",
  },
  {
    id: "mock-job-8",
    title: "Product Manager (Technical Platforms) [TEST / MOCK]",
    company: "SaaSGrid Global [Demo]",
    location: "San Francisco, CA",
    isRemote: false,
    salaryMin: 140000,
    salaryMax: 175000,
    salaryCurrency: "USD",
    salaryPeriod: "year",
    employmentType: "full-time",
    experienceLevel: "senior",
    description:
      "[DEMO LISTING] Define roadmap and execute platform feature development for developer-focused API tools and developer experience portals.",
    postedDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    applicationUrl: "https://example.com/demo-jobs/technical-product-manager",
    tags: ["Product Management", "APIs", "Agile", "Roadmapping", "Analytics"],
    provider: "mock",
  },
  {
    id: "mock-job-9",
    title: "Software Engineering Intern (Summer) [TEST / MOCK]",
    company: "InnoVibe Labs [Demo]",
    location: "Austin, TX",
    isRemote: true,
    salaryMin: 35,
    salaryMax: 45,
    salaryCurrency: "USD",
    salaryPeriod: "hour",
    employmentType: "internship",
    experienceLevel: "entry",
    description:
      "[DEMO LISTING] Exciting 12-week summer internship for CS students interested in building full-stack applications with modern web technologies.",
    postedDate: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    applicationUrl: "https://example.com/demo-jobs/swe-intern",
    tags: ["TypeScript", "Python", "React", "Git"],
    provider: "mock",
  },
  {
    id: "mock-job-10",
    title: "Data Engineer (Pipelines & Warehousing) [TEST / MOCK]",
    company: "MetricData Corp [Demo]",
    location: "Denver, CO",
    isRemote: true,
    salaryMin: 135000,
    salaryMax: 170000,
    salaryCurrency: "USD",
    salaryPeriod: "year",
    employmentType: "full-time",
    experienceLevel: "mid",
    description:
      "[DEMO LISTING] Build robust ETL/ELT data pipelines with dbt, Snowflake, Apache Airflow, and PostgreSQL to empower company-wide analytics.",
    postedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    applicationUrl: "https://example.com/demo-jobs/data-engineer",
    tags: ["Python", "SQL", "dbt", "Snowflake", "Airflow", "PostgreSQL"],
    provider: "mock",
  },
];

export class MockJobProvider implements JobProvider {
  readonly name = "mock";

  async search(filters: JobSearchFilters): Promise<JobSearchResult> {
    // Simulate lightweight network latency (100ms) for realistic UX testing
    await new Promise((resolve) => setTimeout(resolve, 100));

    const page = Math.max(1, filters.page || 1);
    const pageSize = Math.max(1, Math.min(50, filters.pageSize || 6));

    let filtered = [...MOCK_DATABASE];

    // Filter by Query (keywords, title, tags, description)
    if (filters.query && filters.query.trim()) {
      const q = filters.query.toLowerCase().trim();
      const terms = q.split(/\s+/).filter(Boolean);

      filtered = filtered.filter((job) => {
        const fullContent = `${job.title} ${job.company} ${job.description} ${(job.tags || []).join(" ")}`.toLowerCase();
        return terms.some((term) => fullContent.includes(term));
      });
    }

    // Filter by Location
    if (filters.location && filters.location.trim()) {
      const loc = filters.location.toLowerCase().trim();
      filtered = filtered.filter(
        (job) =>
          job.location.toLowerCase().includes(loc) ||
          (loc.includes("remote") && job.isRemote)
      );
    }

    // Filter by Remote
    if (filters.isRemote !== undefined) {
      if (filters.isRemote) {
        filtered = filtered.filter((job) => job.isRemote);
      }
    }

    // Filter by Employment Type
    if (filters.employmentType && filters.employmentType !== "all") {
      filtered = filtered.filter(
        (job) => job.employmentType.toLowerCase() === filters.employmentType?.toLowerCase()
      );
    }

    // Filter by Experience Level
    if (filters.experienceLevel && filters.experienceLevel !== "all") {
      filtered = filtered.filter(
        (job) => job.experienceLevel?.toLowerCase() === filters.experienceLevel?.toLowerCase()
      );
    }

    const totalJobs = filtered.length;
    const totalPages = Math.ceil(totalJobs / pageSize) || 1;
    const startIndex = (page - 1) * pageSize;
    const paginatedJobs = filtered.slice(startIndex, startIndex + pageSize);

    return {
      jobs: paginatedJobs,
      totalJobs,
      currentPage: page,
      totalPages,
      pageSize,
      provider: this.name,
    };
  }
}
