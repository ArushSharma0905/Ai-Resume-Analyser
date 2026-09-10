import { createHash } from "node:crypto";
import {
  Job,
  JobProvider,
  JobSearchFilters,
  JobSearchResult,
} from "@/lib/types/job";

/**
 * JSEARCH JOB PROVIDER (production)
 * ----------------------------------
 * Integrates with the JSearch API v2 (hosted on RapidAPI), which aggregates
 * real-time job listings from multiple publishers (LinkedIn, Indeed,
 * Glassdoor, ZipRecruiter, employer career sites, etc. via Google for Jobs).
 *
 * Request format (endpoint + response shape verified LIVE against the
 * configured JSEARCH_API_KEY):
 *   GET https://jsearch.p.rapidapi.com/search-v2
 *   Headers: x-rapidapi-key: <JSEARCH_API_KEY>
 *            x-rapidapi-host: jsearch.p.rapidapi.com
 *   Params:  query (required, e.g. "developer jobs in chicago")
 *            page (1-based; verified to combine with num_pages)
 *            num_pages (pages returned per call; each page = up to 10 jobs)
 *            date_posted (all | today | 3days | week | month) — freshness.
 *                        NOTE (live-verified): JSearch's Indian index is NOT
 *                        freshness-maintained — country=IN + date_posted=week
 *                        returns 0 jobs, while date_posted=all returns real
 *                        (older) Indian listings. So India searches default to
 *                        date_posted=all (see JSEARCH_INDIA_DATE_POSTED) while
 *                        the rest of the world keeps the week default.
 *            country (e.g. "in" when an Indian location/query is detected;
 *                     live-verified: does NOT geo-filter alone — it re-labels
 *                     US results when the query has no Indian city — so Indian
 *                     queries also embed the city in `query` and results are
 *                     client-verified for Indian locations)
 *            remote_jobs_only ("true"; NOTE: verified to be IGNORED by the
 *                              v2 backend, so remote filtering is enforced
 *                              client-side on job_is_remote as well)
 *            employment_types (FULLTIME, PARTTIME, CONTRACTOR, INTERN)
 *            job_requirements (under_3_years_experience, more_than_3_years_experience,
 *                              no_experience, no_degree)
 *            country (optional; omitted — our location filter goes into `query`)
 *   Response: { status: "OK", request_id, parameters, data: { cursor, jobs: [...] } }
 *
 * REAL-JOBS-ONLY strategy (all verified against live responses):
 * - FRESHNESS: the normal search requests date_posted=week (last 7 days,
 *   provider-enforced). As a safety net, listings whose posting date is older
 *   than JSEARCH_FRESHNESS_DAYS (default 7) are rejected client-side.
 * - STALE/OFFERS: v2 exposes job_offer_expiration_datetime_utc /
 *   job_offer_expiration_timestamp. An offer whose expiration is in the past
 *   is rejected as authoritatively expired.
 * - STATUS LIMITATION (documented, not hidden): JSearch provides NO general
 *   "open/closed" status field. A job with no expiration date (or an unknown
 *   posting date) is kept but is never labeled "open"/"active" anywhere in
 *   the UI — we do not claim availability we cannot verify.
 * - APPLY LINKS: applicationUrl is taken ONLY from the provider (HTTPS only):
 *   job_apply_link (preferred when the provider flags it as a direct employer
 *   application via job_apply_is_direct) or apply_options[].apply_link
 *   (preferring entries flagged is_direct). Listings without any valid HTTPS
 *   link are DROPPED — application URLs are never invented.
 * - PAGINATION: pages are windows over a deduplicated "fresh stream" built by
 *   scanning upstream pages in batches (num_pages) until enough fresh jobs
 *   are collected, the upstream result set is exhausted, or the configured
 *   maximum number of upstream pages is reached. Page 2 is always disjoint
 *   from page 1 (dedupe by stable JSearch job_id). totalJobs is the real
 *   number of qualifying jobs found (a lower bound — JSearch exposes no total
 *   count) and totalPages only claims a next page when we actually hold
 *   enough fresh jobs to fill it. Nothing is fabricated.
 * - All response fields are treated defensively (optional/unknown) so schema
 *   drift cannot crash the provider.
 */

const JSEARCH_API_HOST = "jsearch.p.rapidapi.com";
const JSEARCH_SEARCH_URL = `https://${JSEARCH_API_HOST}/search-v2`;
/** Each upstream page (JSearch page unit) holds up to 10 jobs. */
const JSEARCH_PAGE_SIZE = 10;
const JSEARCH_TIMEOUT_MS = 25_000; // batched calls can be slow upstream; verified 15s is too tight
const MAX_DESCRIPTION_LENGTH = 6_000;
const MAX_TITLE_LENGTH = 200;
const MAX_TAGS = 10;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Freshness: the JSearch date_posted bucket requested for the normal search
 * experience. "week" = jobs posted within the last 7 days (provider-enforced;
 * verified live). Configurable via JSEARCH_DATE_POSTED — defaults require no
 * user configuration.
 */
const DEFAULT_DATE_POSTED = "week";
/**
 * Client-side freshness safety net: reject listings whose provider posting
 * date is older than this many days, even if the upstream bucket let them
 * through. Configurable via JSEARCH_FRESHNESS_DAYS.
 */
const DEFAULT_FRESHNESS_DAYS = 7;
/**
 * India freshness exception. LIVE-VERIFIED: JSearch's Indian index has no
 * postings within the last 7 days (country=IN + a city query + date_posted=week
 * returns 0 jobs; the same query with date_posted=all returns real Indian
 * listings that are ~6-26 days old). To make India (a primary market) usable,
 * India searches default to date_posted=all and a 30-day client-side staleness
 * window — while the rest of the world keeps the strict week/7-day defaults.
 * Both are configurable and clearly documented; the past-expiration rejection
 * is NEVER relaxed.
 */
const DEFAULT_INDIA_DATE_POSTED = "all";
const DEFAULT_INDIA_FRESHNESS_DAYS = 30;
/**
 * Hard cap on upstream result pages scanned per search request — bounds
 * RapidAPI quota usage. Configurable via JSEARCH_MAX_UPSTREAM_PAGES.
 */
const DEFAULT_MAX_UPSTREAM_PAGES = 10;
/**
 * Upstream pages fetched per HTTP call via num_pages (batching verified live:
 * num_pages=3 returns up to 30 jobs in one request). Configurable via
 * JSEARCH_UPSTREAM_BATCH_PAGES.
 */
const DEFAULT_UPSTREAM_BATCH_PAGES = 3;
/** Absolute ceiling for the upstream-pages cap, regardless of configuration. */
const HARD_MAX_UPSTREAM_PAGES = 30;
/**
 * In-process cache of built "fresh streams", keyed by the canonical request
 * params (filters only — NOT the page number). Benefits:
 *  - page 2+ is served from the SAME stream as page 1, so it can never repeat
 *    page-1 jobs even when JSearch re-ranks its live index between requests;
 *  - deep pages reuse already-scanned upstream data instead of re-fetching it
 *    (RapidAPI quota friendly).
 * Entries expire after the TTL or when the size cap is reached; on cache miss
 * (e.g. a recycled serverless instance) the stream is simply rebuilt — the
 * behavior stays correct either way.
 */
const STREAM_CACHE_TTL_MS = 10 * 60 * 1000;
const STREAM_CACHE_MAX_ENTRIES = 50;

/* ------------------------------------------------------------------ */
/* India location detection                                            */
/* ------------------------------------------------------------------ */
/**
 * Because JSearch's `country` parameter does NOT geo-filter (live-verified:
 * country=in + a generic query returns US listings whose job_country field is
 * simply relabeled to "IN"), India searches also embed the Indian city in the
 * query AND client-verify each listing's location against known Indian
 * places. This prevents US/global results from masquerading as Indian jobs.
 */
const INDIA_COUNTRY_TOKENS: string[] = ["india", "bharat"];
const INDIA_CITY_TOKENS: string[] = [
  "delhi", "new delhi", "mumbai", "bombay", "bengaluru", "bangalore",
  "hyderabad", "pune", "chennai", "madras", "kolkata", "calcutta", "noida",
  "gurugram", "gurgaon", "jaipur", "ahmedabad", "lucknow", "chandigarh",
  "indore", "kochi", "cochin", "thiruvananthapuram", "trivandrum", "surat",
  "nagpur", "bhopal", "visakhapatnam", "vizag", "kanpur", "patna",
  "coimbatore", "vadodara", "baroda", "ludhiana", "agra", "nashik",
  "faridabad", "meerut", "rajkot", "varanasi", "amritsar", "prayagraj",
  "ranchi", "guwahati", "gwalior", "jabalpur", "mysuru", "mysore", "kota",
  "dehradun", "bhubaneswar", "srinagar", "jammu", "mangaluru", "mangalore",
  "vijayawada", "hubli", "aurangabad", "noida and greater noida", "greater noida",
];
const INDIA_STATE_TOKENS: string[] = [
  "andhra pradesh", "arunachal pradesh", "assam", "bihar", "chhattisgarh",
  "goa", "gujarat", "haryana", "himachal pradesh", "jharkhand", "karnataka",
  "kerala", "madhya pradesh", "maharashtra", "manipur", "meghalaya", "mizoram",
  "nagaland", "odisha", "orissa", "punjab", "rajasthan", "sikkim",
  "tamil nadu", "telangana", "tripura", "uttar pradesh", "uttarakhand",
  "west bengal", "delhi ncr",
];

function escapeForRegex(token: string): string {
  return token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Word-boundary match so "kota" doesn't match inside "Lakota", etc. */
function textContainsWord(text: string, token: string): boolean {
  if (token.length === 0) return false;
  return new RegExp(`\\b${escapeForRegex(token)}\\b`).test(text);
}

function indiaLocationText(raw: JSearchRawJob): string {
  return [
    asTrimmedString(raw.job_city),
    asTrimmedString(raw.job_state),
    asTrimmedString(raw.job_location),
    asTrimmedString(raw.job_country),
  ]
    .join(" ")
    .toLowerCase();
}

/**
 * True when the listing's location matches a known Indian city, Indian state,
 * or the country tokens "india"/"bharat". Used to verify India searches
 * actually return Indian listings (the provider's job_country is unreliable).
 */
function isIndianLocation(raw: JSearchRawJob): boolean {
  const text = indiaLocationText(raw);
  if (INDIA_CITY_TOKENS.some((c) => textContainsWord(text, c))) return true;
  if (INDIA_STATE_TOKENS.some((s) => textContainsWord(text, s))) return true;
  return INDIA_COUNTRY_TOKENS.some((c) => textContainsWord(text, c));
}

/** Maps a user-supplied country string to a JSearch country code. */
function normalizeCountryCode(raw: string | null | undefined): string | null {
  const value = (raw || "").trim().toLowerCase();
  if (!value) return null;
  if (value === "in" || value === "india" || value === "bharat") return "in";
  if (value === "us" || value === "usa" || value === "united states" || value === "america") return "us";
  return null; // unknown country — leave unconstrained (global behavior)
}

interface JSearchRawJob {
  job_id?: unknown;
  job_title?: unknown;
  employer_name?: unknown;
  employer_logo?: unknown;
  employer_website?: unknown;
  job_publisher?: unknown;
  publisher_name?: unknown;
  job_employment_type?: unknown;
  job_apply_link?: unknown;
  job_apply_is_direct?: unknown;
  job_apply_options?: unknown;
  apply_options?: unknown;
  job_location?: unknown;
  job_employment_types?: unknown;
  job_offer_expiration_datetime_utc?: unknown;
  job_offer_expiration_timestamp?: unknown;
  job_description?: unknown;
  job_is_remote?: unknown;
  job_city?: unknown;
  job_state?: unknown;
  job_country?: unknown;
  job_min_salary?: unknown;
  job_max_salary?: unknown;
  job_salary_currency?: unknown;
  job_salary_period?: unknown;
  job_posted_at_datetime_utc?: unknown;
  job_posted_at_timestamp?: unknown;
  job_required_experience?: unknown;
  job_required_skills?: unknown;
  job_highlights?: unknown;
  job_google_link?: unknown;
}

interface JSearchResponse {
  status?: unknown;
  success?: unknown;
  request_id?: unknown;
  parameters?: unknown;
  data?: unknown;
  message?: unknown;
}

/* ------------------------------------------------------------------ */
/* Normalization helpers (defensive against schema drift)              */
/* ------------------------------------------------------------------ */

function asTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asRoundedNumberOrNull(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return Math.round(value);
}

function isValidHttpsUrl(value: string): boolean {
  return /^https:\/\/.+/i.test(value);
}

function stripHtml(input: string): string {
  return input
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/** Valid HTTPS apply links only (requirement: never fabricate, never downgrade). */
function isValidApplyLink(value: string): boolean {
  return isValidHttpsUrl(value);
}

/** Collects all provider-supplied option apply links (v2 + legacy field name). */
function collectApplyOptionLinks(raw: JSearchRawJob): string[] {
  const links: string[] = [];
  const optionLists = [raw.apply_options, raw.job_apply_options];
  for (const list of optionLists) {
    if (!Array.isArray(list)) continue;
    for (const option of list) {
      if (option && typeof option === "object") {
        const link = asTrimmedString((option as { apply_link?: unknown }).apply_link);
        if (link && isValidApplyLink(link)) links.push(link);
      }
    }
  }
  return links;
}

/** First option link the provider explicitly flags as a direct employer application. */
function firstDirectOptionLink(raw: JSearchRawJob): string | null {
  const optionLists = [raw.apply_options, raw.job_apply_options];
  for (const list of optionLists) {
    if (!Array.isArray(list)) continue;
    for (const option of list) {
      if (option && typeof option === "object") {
        const entry = option as { apply_link?: unknown; is_direct?: unknown };
        const link = asTrimmedString(entry.apply_link);
        if (entry.is_direct === true && link && isValidApplyLink(link)) return link;
      }
    }
  }
  return null;
}

/**
 * Application URL — taken ONLY from the provider payload and must be a valid
 * HTTPS link. Preference order when the provider offers multiple legitimate
 * options (each is a real provider URL — nothing is ever constructed):
 *   1. job_apply_link when flagged as a direct employer application
 *      (job_apply_is_direct === true)
 *   2. the first apply_options[] / job_apply_options[] entry flagged is_direct
 *   3. job_apply_link
 *   4. the first provider-supplied option link
 * Returns null when no usable HTTPS link exists (the listing is dropped).
 */
function resolveApplicationUrl(raw: JSearchRawJob): string | null {
  const primary = asTrimmedString(raw.job_apply_link);

  if (raw.job_apply_is_direct === true && primary && isValidApplyLink(primary)) {
    return primary;
  }

  const directOption = firstDirectOptionLink(raw);
  if (directOption) return directOption;

  if (primary && isValidApplyLink(primary)) return primary;

  const optionLinks = collectApplyOptionLinks(raw);
  if (optionLinks.length > 0) return optionLinks[0];

  return null;
}

/** Stable, deterministic id (same listing => same id across requests). */
function buildStableId(raw: JSearchRawJob): string | null {
  const jobId = asTrimmedString(raw.job_id);
  if (jobId) return `jsearch-${jobId}`;

  // Deterministic fallback for the rare record without a job_id.
  const basis = [
    asTrimmedString(raw.job_title),
    asTrimmedString(raw.employer_name),
    asTrimmedString(raw.job_apply_link),
    asTrimmedString(raw.job_posted_at_datetime_utc),
  ].join("|");
  if (basis.replace(/\|/g, "").length === 0) return null;
  return `jsearch-${createHash("sha1").update(basis).digest("hex")}`;
}

function buildLocation(raw: JSearchRawJob): string {
  // v2 provides a ready-made display string, e.g. "Chicago, IL" / "Anywhere".
  const display = asTrimmedString(raw.job_location);
  if (display) return display;

  const city = asTrimmedString(raw.job_city);
  const state = asTrimmedString(raw.job_state);
  const parts = [city, state].filter(Boolean);
  if (parts.length > 0) return parts.join(", ");

  const country = asTrimmedString(raw.job_country);
  if (country) return country;

  if (raw.job_is_remote === true) return "Remote";
  return "Location not specified";
}

/** Maps JSearch's employment type tokens onto our EmploymentType values. */
function normalizeEmploymentType(value: unknown): string {
  const raw = typeof value === "string" ? value.toUpperCase() : "";
  if (raw.includes("FULL")) return "full-time";
  if (raw.includes("PART")) return "part-time";
  if (raw.includes("CONTRACT")) return "contract";
  if (raw.includes("INTERN")) return "internship";
  if (raw.includes("TEMP")) return "temporary";
  return "other";
}

/**
 * Resolves the employment type from a raw v2 job: `job_employment_type`
 * (e.g. "Full-time") with the `job_employment_types` token array
 * (e.g. ["FULLTIME"]) as fallback.
 */
function employmentTypeOf(raw: JSearchRawJob): unknown {
  const primary = raw.job_employment_type;
  if (typeof primary === "string" && primary.trim()) return primary;
  if (Array.isArray(raw.job_employment_types)) {
    const first = raw.job_employment_types.find(
      (token) => typeof token === "string" && token.trim().length > 0
    );
    if (first) return first;
  }
  return undefined;
}

/** Maps JSearch's salary period onto our "year" | "month" | "hour" union. */
function normalizeSalaryPeriod(value: unknown): "year" | "month" | "hour" | null {
  const period = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (period.startsWith("year")) return "year";
  if (period.startsWith("month")) return "month";
  if (period.startsWith("hour")) return "hour";
  // e.g. "week" is not representable in our Job type — omit rather than fake.
  return null;
}

/** Derives an experience level from the provider's required-experience data. */
function deriveExperienceLevel(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  const exp = value as { no_experience_required?: unknown; required_experience_in_months?: unknown };
  if (exp.no_experience_required === true) return "entry";

  const months =
    typeof exp.required_experience_in_months === "number" && Number.isFinite(exp.required_experience_in_months)
      ? exp.required_experience_in_months
      : null;
  if (months === null) return null;

  if (months < 12) return "entry";
  if (months < 36) return "mid";
  if (months < 84) return "senior";
  return "lead";
}

function resolvePostedDate(raw: JSearchRawJob): string | null {
  const iso = asTrimmedString(raw.job_posted_at_datetime_utc);
  if (iso) return iso;

  // Unix seconds fallback.
  if (typeof raw.job_posted_at_timestamp === "number" && Number.isFinite(raw.job_posted_at_timestamp)) {
    return new Date(raw.job_posted_at_timestamp * 1000).toISOString();
  }
  return null;
}

/**
 * Stale-offer detection. JSearch v2 exposes
 * job_offer_expiration_datetime_utc / job_offer_expiration_timestamp. When an
 * expiration date is present and in the past, the offer is authoritatively
 * expired and the listing is rejected. When the field is absent we CANNOT
 * know whether the job is still open (JSearch has no general open/closed
 * status) — such listings are kept and are never presented as "open"/"active".
 */
function isExplicitlyExpired(raw: JSearchRawJob, nowMs: number): boolean {
  let expirationMs: number | null = null;

  const iso = asTrimmedString(raw.job_offer_expiration_datetime_utc);
  if (iso) {
    const parsed = Date.parse(iso);
    if (Number.isFinite(parsed)) expirationMs = parsed;
  }
  if (
    expirationMs === null &&
    typeof raw.job_offer_expiration_timestamp === "number" &&
    Number.isFinite(raw.job_offer_expiration_timestamp)
  ) {
    // JSearch timestamps are Unix seconds.
    expirationMs = raw.job_offer_expiration_timestamp * 1000;
  }

  return expirationMs !== null && expirationMs < nowMs;
}

/**
 * Freshness safety net: reject listings whose provider posting date is older
 * than the configured window. Listings with NO (or unparseable) posting date
 * are kept — an unknown date is not evidence of staleness — and surface in the
 * UI with the neutral "Recently posted" label (the provider's date is always
 * the source of truth; we never invent or alter it).
 */
function isWithinFreshnessWindow(job: Job, nowMs: number, freshnessDays: number): boolean {
  if (!job.postedDate) return true;
  const postedMs = Date.parse(job.postedDate);
  if (!Number.isFinite(postedMs)) return true;
  const ageMs = nowMs - postedMs;
  if (ageMs < 0) return true; // clock skew / future-dated posting
  return ageMs <= freshnessDays * DAY_MS;
}

function extractTags(raw: JSearchRawJob): string[] {
  if (!Array.isArray(raw.job_required_skills)) return [];
  return raw.job_required_skills
    .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    .map((item) => item.trim())
    .slice(0, MAX_TAGS);
}

/** Normalizes one raw JSearch record into our Job shape. Null => drop listing. */
function normalizeJob(raw: JSearchRawJob): Job | null {
  const applicationUrl = resolveApplicationUrl(raw);
  if (!applicationUrl) return null; // never invent an application URL

  const id = buildStableId(raw);
  if (!id) return null;

  const description = asTrimmedString(raw.job_description);
  const title = stripHtml(asTrimmedString(raw.job_title)).slice(0, MAX_TITLE_LENGTH);

  return {
    id,
    title: title || "Untitled Position",
    company: asTrimmedString(raw.employer_name) || "Company Not Specified",
    location: buildLocation(raw),
    isRemote: raw.job_is_remote === true,
    salaryMin: asRoundedNumberOrNull(raw.job_min_salary),
    salaryMax: asRoundedNumberOrNull(raw.job_max_salary),
    salaryCurrency: asTrimmedString(raw.job_salary_currency) || null,
    salaryPeriod: normalizeSalaryPeriod(raw.job_salary_period),
    employmentType: normalizeEmploymentType(employmentTypeOf(raw)),
    experienceLevel: deriveExperienceLevel(raw.job_required_experience),
    description: description ? stripHtml(description).slice(0, MAX_DESCRIPTION_LENGTH) : "No description provided.",
    postedDate: resolvePostedDate(raw),
    applicationUrl,
    tags: extractTags(raw),
    provider: "jsearch",
  };
}

/**
 * Extracts the raw job array from a /search-v2 response payload.
 * Verified live shape: { status: "OK", ..., data: { cursor, jobs: [...] } }.
 * A legacy flat-array `data` shape is also accepted defensively. Returns
 * null when neither shape is present (malformed payload).
 */
function extractJobs(payload: JSearchResponse): JSearchRawJob[] | null {
  const data = payload.data;
  if (Array.isArray(data)) return data as JSearchRawJob[];
  if (data && typeof data === "object") {
    const jobs = (data as { jobs?: unknown }).jobs;
    if (Array.isArray(jobs)) return jobs as JSearchRawJob[];
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Provider                                                            */
/* ------------------------------------------------------------------ */

/**
 * A partially/fully built "fresh stream" for one search-filter combination.
 * Cached between requests so consecutive pages share the same stream.
 */
interface JSearchStreamCacheEntry {
  /** Qualifying (deduped, fresh, unexpired, applyable) jobs, in scan order. */
  freshJobs: Job[];
  /** Stable ids of every unique candidate seen (fresh or not). */
  seenIds: Set<string>;
  /** Upstream result pages consumed so far. */
  scannedPages: number;
  /** Next upstream page index to fetch when extending the stream. */
  nextPage: number;
  /** True once an upstream batch came back short (end of results). */
  upstreamExhausted: boolean;
  /** Timestamp of the last stream build/extension (TTL basis). */
  createdAt: number;
}

export class JSearchJobProvider implements JobProvider {
  readonly name = "jsearch";
  private readonly apiKey?: string;
  /** JSearch date_posted bucket requested for normal searches (default "week"). */
  private readonly datePosted: string;
  /** Client-side staleness cutoff in days (default 7). */
  private readonly freshnessDays: number;
  /** Hard cap on upstream pages scanned per search (default 10). */
  private readonly maxUpstreamPages: number;
  /** Upstream pages per HTTP call via num_pages (default 3). */
  private readonly upstreamBatchPages: number;
  /** JSearch date_posted bucket for India searches (default "all", see docs). */
  private readonly indiaDatePosted: string;
  /** Client-side staleness cutoff in days for India searches (default 30). */
  private readonly indiaFreshnessDays: number;

  constructor() {
    this.apiKey = process.env.JSEARCH_API_KEY?.trim() || undefined;

    // Optional tuning via env — sensible defaults mean no configuration is
    // required (and nothing user-facing needs to be set).
    const datePosted = process.env.JSEARCH_DATE_POSTED?.trim().toLowerCase();
    this.datePosted = datePosted || DEFAULT_DATE_POSTED;

    const freshnessDays = Number(process.env.JSEARCH_FRESHNESS_DAYS);
    this.freshnessDays =
      Number.isFinite(freshnessDays) && freshnessDays > 0
        ? Math.floor(freshnessDays)
        : DEFAULT_FRESHNESS_DAYS;

    const indiaDatePosted = process.env.JSEARCH_INDIA_DATE_POSTED?.trim().toLowerCase();
    this.indiaDatePosted = indiaDatePosted || DEFAULT_INDIA_DATE_POSTED;

    const indiaFreshnessDays = Number(process.env.JSEARCH_INDIA_FRESHNESS_DAYS);
    this.indiaFreshnessDays =
      Number.isFinite(indiaFreshnessDays) && indiaFreshnessDays > 0
        ? Math.floor(indiaFreshnessDays)
        : DEFAULT_INDIA_FRESHNESS_DAYS;

    const maxUpstreamPages = Number(process.env.JSEARCH_MAX_UPSTREAM_PAGES);
    this.maxUpstreamPages =
      Number.isFinite(maxUpstreamPages) && maxUpstreamPages > 0
        ? Math.min(HARD_MAX_UPSTREAM_PAGES, Math.floor(maxUpstreamPages))
        : DEFAULT_MAX_UPSTREAM_PAGES;

    const upstreamBatchPages = Number(process.env.JSEARCH_UPSTREAM_BATCH_PAGES);
    this.upstreamBatchPages =
      Number.isFinite(upstreamBatchPages) && upstreamBatchPages > 0
        ? Math.min(10, Math.floor(upstreamBatchPages))
        : DEFAULT_UPSTREAM_BATCH_PAGES;
  }

  /**
   * Best-effort country inference (additive — the API works without it):
   *   1. An explicit `country` on the filters wins.
   *   2. Otherwise, detect India from the location/search text (Indian cities,
   *      states, or "India"/"Bharat"). No other country is inferred — searches
   *      without Indian signals keep their existing market-neutral behavior.
   */
  private detectCountry(filters: Partial<JobSearchFilters>): string | null {
    const explicit = normalizeCountryCode(filters.country);
    if (explicit) return explicit;

    const haystack = `${filters.location || ""} ${filters.query || ""}`.toLowerCase();
    if (INDIA_CITY_TOKENS.some((c) => textContainsWord(haystack, c))) return "in";
    if (INDIA_STATE_TOKENS.some((s) => textContainsWord(haystack, s))) return "in";
    if (INDIA_COUNTRY_TOKENS.some((c) => textContainsWord(haystack, c))) return "in";
    return null;
  }

  /** Fresh streams keyed by canonical request params (filters, not page). */
  private readonly streamCache = new Map<string, JSearchStreamCacheEntry>();

  /** Drops expired entries and enforces the cache size cap (oldest first). */
  private pruneStreamCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.streamCache) {
      if (now - entry.createdAt > STREAM_CACHE_TTL_MS) {
        this.streamCache.delete(key);
      }
    }
    while (this.streamCache.size > STREAM_CACHE_MAX_ENTRIES) {
      let oldestKey: string | null = null;
      let oldestAt = Number.POSITIVE_INFINITY;
      for (const [key, entry] of this.streamCache) {
        if (entry.createdAt < oldestAt) {
          oldestAt = entry.createdAt;
          oldestKey = key;
        }
      }
      if (!oldestKey) break;
      this.streamCache.delete(oldestKey);
    }
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  async search(filters: JobSearchFilters): Promise<JobSearchResult> {
    if (!this.apiKey) {
      throw new Error(
        "JSearch provider is not configured: JSEARCH_API_KEY is missing. " +
          "Add JSEARCH_API_KEY (your RapidAPI key for the JSearch API) to .env.local locally, " +
          "or to your hosting provider's environment variables in production."
      );
    }

    const page = Math.max(1, Math.floor(filters.page || 1));
    const pageSize = Math.max(
      1,
      Math.min(JSEARCH_PAGE_SIZE, Math.floor(filters.pageSize || JSEARCH_PAGE_SIZE))
    );
    const nowMs = Date.now();

    // Country-aware search. India is detected from an explicit filter, the
    // search location, or the query text; only India is special-cased so all
    // international searches keep their existing behavior.
    const country = this.detectCountry(filters);
    const isIndia = country === "in";
    const freshnessDays = isIndia ? this.indiaFreshnessDays : this.freshnessDays;

    const requestParams = this.buildRequestParams(filters, country);

    // Fresh-stream cache: pages of one browsing session share the SAME
    // deduplicated stream, so page 2 can never repeat page 1 even when JSearch
    // re-ranks its index between requests, and already-scanned upstream pages
    // are never re-fetched (quota friendly). On a cache miss (TTL expired or a
    // recycled serverless instance) the stream is simply rebuilt.
    const cacheKey = requestParams.toString();
    let stream = this.streamCache.get(cacheKey);
    if (!stream || nowMs - stream.createdAt > STREAM_CACHE_TTL_MS) {
      stream = {
        freshJobs: [],
        seenIds: new Set<string>(),
        scannedPages: 0,
        nextPage: 1,
        upstreamExhausted: false,
        createdAt: nowMs,
      };
    }

    const targetCount = page * pageSize; // fresh jobs needed to fill the window
    const stretchCount = targetCount + pageSize; // +1 window => truthful hasMore

    while (
      stream.freshJobs.length < stretchCount &&
      !stream.upstreamExhausted &&
      stream.scannedPages < this.maxUpstreamPages
    ) {
      const batchPages = Math.min(
        this.upstreamBatchPages,
        this.maxUpstreamPages - stream.scannedPages
      );
      let rawJobs: JSearchRawJob[];
      try {
        rawJobs = await this.fetchUpstreamBatch(requestParams, stream.nextPage, batchPages);
      } catch (err) {
        if (stream.freshJobs.length >= targetCount) {
          // We already hold enough fresh jobs to serve the requested window —
          // return the real jobs collected so far instead of failing the whole
          // search. Nothing is fabricated: hasMore stays truthful (a next page
          // is never claimed beyond the fresh jobs we actually hold).
          console.warn(
            `JSearch: upstream batch failed after ${stream.scannedPages} scanned page(s); ` +
              `returning the ${stream.freshJobs.length} fresh jobs already collected.`,
            err instanceof Error ? err.message : err
          );
          break;
        }
        // Not enough data to fill the window — surface the real error.
        throw err;
      }
      stream.scannedPages += batchPages;
      stream.nextPage += batchPages;

      for (const raw of rawJobs) {
        const job = normalizeJob(raw);
        if (!job) continue; // no valid HTTPS apply link / no stable id -> drop
        if (stream.seenIds.has(job.id)) continue; // dedupe by stable JSearch job id
        stream.seenIds.add(job.id);
        if (isExplicitlyExpired(raw, nowMs)) continue; // provider says offer expired
        if (!isWithinFreshnessWindow(job, nowMs, freshnessDays)) continue; // stale
        // The provider's `country` label is unreliable (US jobs get relabeled
        // "IN"), so India searches additionally verify the listing is actually
        // located in India. This blocks US/global results from masquerading as
        // Indian jobs while leaving international searches untouched.
        if (isIndia && !isIndianLocation(raw)) continue;
        if (filters.isRemote === true && !job.isRemote) continue; // v2 ignores remote_jobs_only (verified) — enforce client-side
        stream.freshJobs.push(job);
      }

      // A short batch means the upstream result set is exhausted.
      if (rawJobs.length < batchPages * JSEARCH_PAGE_SIZE) {
        stream.upstreamExhausted = true;
      }
    }

    // Persist/refresh the stream so subsequent page requests reuse it.
    stream.createdAt = Date.now();
    this.streamCache.set(cacheKey, stream);
    this.pruneStreamCache();

    // Window over the FRESH stream: boundaries are computed after stale,
    // expired and duplicate listings were removed, so consecutive pages are
    // always disjoint and no qualifying job is skipped between pages.
    const windowStart = (page - 1) * pageSize;
    const jobs = stream.freshJobs.slice(windowStart, windowStart + pageSize);

    // totalJobs is the REAL number of qualifying fresh jobs found while
    // scanning (a lower bound on actual availability — JSearch exposes no
    // total result count). hasMore is truthful: a next page is only claimed
    // when we actually hold enough fresh jobs to fill it. Nothing fabricated.
    const hasMore = stream.freshJobs.length > targetCount;
    const totalJobs = stream.freshJobs.length;
    const totalPages = hasMore ? page + 1 : page;

    if (jobs.length === 0) {
      console.warn(
        `JSearch: no qualifying fresh jobs for the requested window ` +
          `(page=${page}, upstreamPagesScanned=${stream.scannedPages}, uniqueCandidates=${stream.seenIds.size}, freshFound=${stream.freshJobs.length}).`
      );
    }

    return {
      jobs,
      totalJobs,
      currentPage: page,
      totalPages,
      pageSize,
      provider: this.name,
    };
  }

  /**
   * Builds the JSearch request params from our generic filters.
   * `query` is always present (JSearch requires it); when the user only
   * supplies a location we search "jobs in <location>".
   * When `country` is non-null (e.g. "in"), it is passed through and the
   * date_posted bucket is selected per-country (India defaults to "all" —
   * live-verified JSearch has no sub-7-day Indian index).
   */
  private buildRequestParams(
    filters: Partial<JobSearchFilters>,
    country: string | null
  ): URLSearchParams {
    const params = new URLSearchParams();

    const searchTerm = filters.query?.trim() || "jobs";
    const location = filters.location?.trim();
    params.set("query", location ? `${searchTerm} in ${location}` : searchTerm);

    // Freshness: request recent postings only for the normal search
    // experience (JSearch buckets: today | 3days | week | month | all).
    // India uses its own bucket because JSearch does not freshness-keep the
    // Indian index (verified live — week returns 0; all returns real listings).
    params.set("date_posted", country === "in" ? this.indiaDatePosted : this.datePosted);

    if (country) {
      params.set("country", country);
    }

    if (filters.isRemote === true) {
      // Sent for good measure — verified that the v2 backend currently IGNORES
      // this param, so remote filtering is also enforced client-side.
      params.set("remote_jobs_only", "true");
    }

    const employmentTypes = this.mapEmploymentTypes(filters.employmentType);
    if (employmentTypes) {
      params.set("employment_types", employmentTypes);
    }

    const jobRequirements = this.mapExperienceLevel(filters.experienceLevel);
    if (jobRequirements) {
      params.set("job_requirements", jobRequirements);
    }

    return params;
  }

  /** Maps our EmploymentType to JSearch's documented employment_types tokens. */
  private mapEmploymentTypes(employmentType?: string): string | null {
    if (!employmentType || employmentType === "all") return null;
    const map: Record<string, string> = {
      "full-time": "FULLTIME",
      "part-time": "PARTTIME",
      contract: "CONTRACTOR",
      internship: "INTERN",
    };
    // "temporary" / "other" have no JSearch equivalent — leave unfiltered.
    return map[employmentType.toLowerCase()] ?? null;
  }

  /**
   * Approximates our ExperienceLevel with JSearch's documented
   * job_requirements buckets (JSearch has no direct level filter).
   */
  private mapExperienceLevel(experienceLevel?: string): string | null {
    if (!experienceLevel || experienceLevel === "all") return null;
    switch (experienceLevel.toLowerCase()) {
      case "entry":
        return "no_experience";
      case "mid":
        return "under_3_years_experience";
      case "senior":
      case "lead":
      case "executive":
        return "more_than_3_years_experience";
      default:
        return null;
    }
  }

  private hasOptionalFilters(params: URLSearchParams): boolean {
    return (
      params.has("remote_jobs_only") ||
      params.has("employment_types") ||
      params.has("job_requirements")
    );
  }

  /**
   * Fetches up to `numPages` upstream result pages in a SINGLE HTTP request
   * (verified live: /search-v2 honors `page` combined with `num_pages` and
   * returns the pages starting at `page`). If the API rejects optional filter
   * params (HTTP 400/422), retries once with the base query only so the core
   * search keeps working instead of failing outright.
   */
  private async fetchUpstreamBatch(
    params: URLSearchParams,
    page: number,
    numPages: number
  ): Promise<JSearchRawJob[]> {
    try {
      const payload = await this.fetchJSearchPage(params, page, numPages);
      return extractJobs(payload) ?? [];
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (this.hasOptionalFilters(params) && /HTTP 400|HTTP 422/.test(message)) {
        console.warn(
          "JSearch rejected optional filter params; retrying search with the base query only."
        );
        // Preserve query/country/date_posted, drop only the optional filters.
        const baseParams = new URLSearchParams(params);
        baseParams.delete("remote_jobs_only");
        baseParams.delete("employment_types");
        baseParams.delete("job_requirements");
        const payload = await this.fetchJSearchPage(baseParams, page, numPages);
        return extractJobs(payload) ?? [];
      }
      throw err;
    }
  }

  private async fetchJSearchPage(
    params: URLSearchParams,
    page: number,
    numPages: number
  ): Promise<JSearchResponse> {
    if (!this.apiKey) {
      throw new Error(
        "JSearch provider is not configured: JSEARCH_API_KEY is missing."
      );
    }

    const requestParams = new URLSearchParams(params);
    requestParams.set("page", String(page));
    requestParams.set("num_pages", String(Math.max(1, numPages)));

    let response: Response;
    try {
      response = await fetch(`${JSEARCH_SEARCH_URL}?${requestParams.toString()}`, {
        method: "GET",
        headers: {
          "x-rapidapi-key": this.apiKey,
          "x-rapidapi-host": JSEARCH_API_HOST,
          Accept: "application/json",
        },
        cache: "no-store", // always live results, never cached
        signal: AbortSignal.timeout(JSEARCH_TIMEOUT_MS),
      });
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      throw new Error(`JSearch provider unavailable: request failed (${reason}).`);
    }

    if (!response.ok) {
      const bodySnippet = (await response.text().catch(() => "")).slice(0, 300);
      if (response.status === 401 || response.status === 403) {
        throw new Error(
          `JSearch authentication failed (HTTP ${response.status}). Verify that JSEARCH_API_KEY is a valid RapidAPI key subscribed to the JSearch API. ${bodySnippet}`.trim()
        );
      }
      if (response.status === 429) {
        throw new Error(
          `JSearch rate limit exceeded (HTTP 429). Check your RapidAPI quota/plan for the JSearch API and retry later. ${bodySnippet}`.trim()
        );
      }
      if (response.status >= 500) {
        throw new Error(
          `JSearch provider unavailable (HTTP ${response.status} ${response.statusText}). ${bodySnippet}`.trim()
        );
      }
      throw new Error(
        `JSearch request failed (HTTP ${response.status} ${response.statusText}). ${bodySnippet}`.trim()
      );
    }

    let payload: JSearchResponse;
    try {
      payload = (await response.json()) as JSearchResponse;
    } catch {
      throw new Error("JSearch provider data error: malformed (non-JSON) response.");
    }

    if (
      !payload ||
      (payload.status !== "OK" && payload.success !== true) ||
      extractJobs(payload) === null
    ) {
      const providerMessage =
        payload && typeof payload.message === "string" && payload.message.trim()
          ? payload.message.trim()
          : "unexpected response shape";
      throw new Error(`JSearch provider data error: ${providerMessage}.`);
    }

    return payload;
  }
}