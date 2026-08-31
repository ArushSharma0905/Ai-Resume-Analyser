import { z } from "zod";

export const ContactInfoSchema = z.object({
  name: z.string().default("Unknown Candidate"),
  email: z.string().nullable().optional().default(null),
  phone: z.string().nullable().optional().default(null),
  location: z.string().nullable().optional().default(null),
  linkedin: z.string().nullable().optional().default(null),
  github: z.string().nullable().optional().default(null),
  portfolio: z.string().nullable().optional().default(null),
});

export const SkillGroupSchema = z.object({
  technicalSkills: z.array(z.string()).default([]),
  frameworksAndLibraries: z.array(z.string()).default([]),
  toolsAndCloud: z.array(z.string()).default([]),
  softSkills: z.array(z.string()).default([]),
  languages: z.array(z.string()).default([]),
});

export const WorkExperienceItemSchema = z.object({
  company: z.string().default("Company"),
  role: z.string().default("Role"),
  location: z.string().nullable().optional().default(null),
  startDate: z.string().default(""),
  endDate: z.string().default(""),
  isCurrent: z.boolean().default(false),
  highlights: z.array(z.string()).default([]),
  technologies: z.array(z.string()).default([]),
});

export const EducationItemSchema = z.object({
  institution: z.string().default("Institution"),
  degree: z.string().default("Degree"),
  fieldOfStudy: z.string().default(""),
  startDate: z.string().nullable().optional().default(null),
  endDate: z.string().nullable().optional().default(null),
  gpaOrGrade: z.string().nullable().optional().default(null),
  highlights: z.array(z.string()).optional().default([]),
});

export const ProjectItemSchema = z.object({
  name: z.string().default("Project"),
  description: z.string().default(""),
  role: z.string().nullable().optional().default(null),
  technologies: z.array(z.string()).default([]),
  link: z.string().nullable().optional().default(null),
  highlights: z.array(z.string()).default([]),
});

export const BaseCertificationItemSchema = z.object({
  name: z.string().default("Certification"),
  issuer: z.string().default("Issuer"),
  issueDate: z.string().nullable().optional().default(null),
  credentialId: z.string().nullable().optional().default(null),
});

// Resilient schema accepting either structured object or raw string fallback
export const CertificationItemSchema = z.union([
  BaseCertificationItemSchema,
  z.string().transform((str) => ({
    name: str,
    issuer: "Certification Authority",
    issueDate: null,
    credentialId: null,
  })),
]);

export const ParsedResumeSchema = z.object({
  contact: ContactInfoSchema.default({
    name: "Unknown Candidate",
    email: null,
    phone: null,
    location: null,
    linkedin: null,
    github: null,
    portfolio: null,
  }),
  professionalSummary: z.string().default(""),
  targetRoleOrTitle: z.string().default("Professional"),
  totalYearsExperience: z.number().default(0),
  domainOrField: z.string().default("General"),
  skills: SkillGroupSchema.default({
    technicalSkills: [],
    frameworksAndLibraries: [],
    toolsAndCloud: [],
    softSkills: [],
    languages: [],
  }),
  workExperience: z.array(WorkExperienceItemSchema).default([]),
  education: z.array(EducationItemSchema).default([]),
  projects: z.array(ProjectItemSchema).default([]),
  certifications: z.array(CertificationItemSchema).default([]),
});

export const AtsCategoryStatusSchema = z.enum(["excellent", "good", "needs_improvement", "critical"]);

export const AtsScoreCategorySchema = z.object({
  score: z.number().min(0).max(100).default(70),
  title: z.string(),
  status: AtsCategoryStatusSchema.default("good"),
  feedback: z.array(z.string()).default([]),
});

export const AtsScoreReportSchema = z.object({
  overallScore: z.number().min(0).max(100).default(70),
  summary: z.string().default("Resume quality and ATS analysis complete."),
  breakdown: z.object({
    impactAndQuantification: AtsScoreCategorySchema,
    actionVerbsAndLanguage: AtsScoreCategorySchema,
    structureAndCompleteness: AtsScoreCategorySchema,
    skillsAndKeywords: AtsScoreCategorySchema,
  }),
  keyStrengths: z.array(z.string()).default([]),
  criticalImprovements: z.array(z.string()).default([]),
  missingElements: z.array(z.string()).default([]),
  detectedKeywords: z.array(z.string()).default([]),
  recommendedKeywords: z.array(z.string()).default([]),
});

export const ResumeAnalysisOutputSchema = z.object({
  parsedResume: ParsedResumeSchema,
  atsScoreReport: AtsScoreReportSchema,
});

export type ResumeAnalysisOutput = z.infer<typeof ResumeAnalysisOutputSchema>;

// Strict JSON Schema passed to Gemini config.responseSchema
export const RESUME_ANALYSIS_JSON_SCHEMA = {
  type: "OBJECT",
  properties: {
    parsedResume: {
      type: "OBJECT",
      properties: {
        contact: {
          type: "OBJECT",
          properties: {
            name: { type: "STRING" },
            email: { type: "STRING" },
            phone: { type: "STRING" },
            location: { type: "STRING" },
            linkedin: { type: "STRING" },
            github: { type: "STRING" },
            portfolio: { type: "STRING" },
          },
          required: ["name"],
        },
        professionalSummary: { type: "STRING" },
        targetRoleOrTitle: { type: "STRING" },
        totalYearsExperience: { type: "NUMBER" },
        domainOrField: { type: "STRING" },
        skills: {
          type: "OBJECT",
          properties: {
            technicalSkills: { type: "ARRAY", items: { type: "STRING" } },
            frameworksAndLibraries: { type: "ARRAY", items: { type: "STRING" } },
            toolsAndCloud: { type: "ARRAY", items: { type: "STRING" } },
            softSkills: { type: "ARRAY", items: { type: "STRING" } },
            languages: { type: "ARRAY", items: { type: "STRING" } },
          },
          required: [
            "technicalSkills",
            "frameworksAndLibraries",
            "toolsAndCloud",
            "softSkills",
            "languages",
          ],
        },
        workExperience: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              company: { type: "STRING" },
              role: { type: "STRING" },
              location: { type: "STRING" },
              startDate: { type: "STRING" },
              endDate: { type: "STRING" },
              isCurrent: { type: "BOOLEAN" },
              highlights: { type: "ARRAY", items: { type: "STRING" } },
              technologies: { type: "ARRAY", items: { type: "STRING" } },
            },
            required: [
              "company",
              "role",
              "startDate",
              "endDate",
              "isCurrent",
              "highlights",
              "technologies",
            ],
          },
        },
        education: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              institution: { type: "STRING" },
              degree: { type: "STRING" },
              fieldOfStudy: { type: "STRING" },
              startDate: { type: "STRING" },
              endDate: { type: "STRING" },
              gpaOrGrade: { type: "STRING" },
              highlights: { type: "ARRAY", items: { type: "STRING" } },
            },
            required: ["institution", "degree", "fieldOfStudy"],
          },
        },
        projects: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              name: { type: "STRING" },
              description: { type: "STRING" },
              role: { type: "STRING" },
              technologies: { type: "ARRAY", items: { type: "STRING" } },
              link: { type: "STRING" },
              highlights: { type: "ARRAY", items: { type: "STRING" } },
            },
            required: ["name", "description", "technologies", "highlights"],
          },
        },
        certifications: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              name: { type: "STRING" },
              issuer: { type: "STRING" },
              issueDate: { type: "STRING" },
              credentialId: { type: "STRING" },
            },
            required: ["name", "issuer"],
          },
        },
      },
      required: [
        "contact",
        "professionalSummary",
        "targetRoleOrTitle",
        "totalYearsExperience",
        "domainOrField",
        "skills",
        "workExperience",
        "education",
        "projects",
        "certifications",
      ],
    },
    atsScoreReport: {
      type: "OBJECT",
      properties: {
        overallScore: { type: "INTEGER" },
        summary: { type: "STRING" },
        breakdown: {
          type: "OBJECT",
          properties: {
            impactAndQuantification: {
              type: "OBJECT",
              properties: {
                score: { type: "INTEGER" },
                title: { type: "STRING" },
                status: {
                  type: "STRING",
                  enum: ["excellent", "good", "needs_improvement", "critical"],
                },
                feedback: { type: "ARRAY", items: { type: "STRING" } },
              },
              required: ["score", "title", "status", "feedback"],
            },
            actionVerbsAndLanguage: {
              type: "OBJECT",
              properties: {
                score: { type: "INTEGER" },
                title: { type: "STRING" },
                status: {
                  type: "STRING",
                  enum: ["excellent", "good", "needs_improvement", "critical"],
                },
                feedback: { type: "ARRAY", items: { type: "STRING" } },
              },
              required: ["score", "title", "status", "feedback"],
            },
            structureAndCompleteness: {
              type: "OBJECT",
              properties: {
                score: { type: "INTEGER" },
                title: { type: "STRING" },
                status: {
                  type: "STRING",
                  enum: ["excellent", "good", "needs_improvement", "critical"],
                },
                feedback: { type: "ARRAY", items: { type: "STRING" } },
              },
              required: ["score", "title", "status", "feedback"],
            },
            skillsAndKeywords: {
              type: "OBJECT",
              properties: {
                score: { type: "INTEGER" },
                title: { type: "STRING" },
                status: {
                  type: "STRING",
                  enum: ["excellent", "good", "needs_improvement", "critical"],
                },
                feedback: { type: "ARRAY", items: { type: "STRING" } },
              },
              required: ["score", "title", "status", "feedback"],
            },
          },
          required: [
            "impactAndQuantification",
            "actionVerbsAndLanguage",
            "structureAndCompleteness",
            "skillsAndKeywords",
          ],
        },
        keyStrengths: { type: "ARRAY", items: { type: "STRING" } },
        criticalImprovements: { type: "ARRAY", items: { type: "STRING" } },
        missingElements: { type: "ARRAY", items: { type: "STRING" } },
        detectedKeywords: { type: "ARRAY", items: { type: "STRING" } },
        recommendedKeywords: { type: "ARRAY", items: { type: "STRING" } },
      },
      required: [
        "overallScore",
        "summary",
        "breakdown",
        "keyStrengths",
        "criticalImprovements",
        "missingElements",
        "detectedKeywords",
        "recommendedKeywords",
      ],
    },
  },
  required: ["parsedResume", "atsScoreReport"],
};

// ---------------------------------------------------------------------------
// Phase 3: AI Job Matching — MatchResult schema
// ---------------------------------------------------------------------------

export const MatchResultSchema = z.object({
  overallScore: z.number().int().min(0).max(100),
  recommendation: z.string(),
  summary: z.string(),
  matchedSkills: z.array(z.string()),
  missingSkills: z.array(z.string()),
  transferableSkills: z.array(z.string()),
  experienceFit: z.string(),
  educationFit: z.string(),
  seniorityFit: z.string(),
  strengths: z.array(z.string()),
  concerns: z.array(z.string()),
  interviewPreparation: z.array(z.string()),
  confidence: z.enum(["low", "medium", "high"]),
});

export type MatchResult = z.infer<typeof MatchResultSchema>;

// Strict JSON Schema passed to Gemini config.responseSchema for job matching
export const JOB_MATCH_JSON_SCHEMA = {
  type: "OBJECT",
  properties: {
    overallScore: { type: "INTEGER" },
    recommendation: { type: "STRING" },
    summary: { type: "STRING" },
    matchedSkills: { type: "ARRAY", items: { type: "STRING" } },
    missingSkills: { type: "ARRAY", items: { type: "STRING" } },
    transferableSkills: { type: "ARRAY", items: { type: "STRING" } },
    experienceFit: { type: "STRING" },
    educationFit: { type: "STRING" },
    seniorityFit: { type: "STRING" },
    strengths: { type: "ARRAY", items: { type: "STRING" } },
    concerns: { type: "ARRAY", items: { type: "STRING" } },
    interviewPreparation: { type: "ARRAY", items: { type: "STRING" } },
    confidence: { type: "STRING", enum: ["low", "medium", "high"] },
  },
  required: [
    "overallScore",
    "recommendation",
    "summary",
    "matchedSkills",
    "missingSkills",
    "transferableSkills",
    "experienceFit",
    "educationFit",
    "seniorityFit",
    "strengths",
    "concerns",
    "interviewPreparation",
    "confidence",
  ],
};

// ---------------------------------------------------------------------------
// Phase 4: AI Resume Optimizer — Zod schemas & raw JSON schema for Gemini
// ---------------------------------------------------------------------------

export const SuggestedChangeSchema = z.object({
  section: z.enum(["professionalSummary", "workExperience", "projects", "skills", "ats"]),
  title: z.string().min(1),
  originalText: z.string(),
  suggestedText: z.string(),
  reason: z.string().min(1),
  confidence: z.enum(["high", "medium", "low"]),
});

export const KeywordSuggestionSchema = z.object({
  keyword: z.string().min(1),
  context: z.string().min(1),
  supportedByResume: z.boolean(),
});

export const IdentifiedGapSchema = z.object({
  requirement: z.string().min(1),
  resumeEvidence: z.string(),
  severity: z.enum(["critical", "major", "minor"]),
  recommendation: z.string().min(1),
});

export const OptimizedExperienceItemSchema = z.object({
  company: z.string().default("Company"),
  role: z.string().default("Role"),
  location: z.string().nullable().optional().default(null),
  startDate: z.string().default(""),
  endDate: z.string().default(""),
  isCurrent: z.boolean().default(false),
  optimizedHighlights: z.array(z.string()).default([]),
  technologies: z.array(z.string()).default([]),
});

export const OptimizedProjectItemSchema = z.object({
  name: z.string().default("Project"),
  optimizedDescription: z.string().default(""),
  role: z.string().nullable().optional().default(null),
  optimizedTechnologies: z.array(z.string()).default([]),
  optimizedHighlights: z.array(z.string()).default([]),
  link: z.string().nullable().optional().default(null),
});

export const ResumeOptimizationResultSchema = z.object({
  optimizedSummary: z.string().default(""),
  optimizedExperience: z.array(OptimizedExperienceItemSchema).default([]),
  optimizedProjects: z.array(OptimizedProjectItemSchema).default([]),
  optimizedSkills: SkillGroupSchema.default({
    technicalSkills: [],
    frameworksAndLibraries: [],
    toolsAndCloud: [],
    softSkills: [],
    languages: [],
  }),
  keywordSuggestions: z.array(KeywordSuggestionSchema).default([]),
  atsImprovements: z.array(z.string()).default([]),
  identifiedGaps: z.array(IdentifiedGapSchema).default([]),
  changes: z.array(SuggestedChangeSchema).default([]),
  warnings: z.array(z.string()).default([]),
});

export type ResumeOptimizationResult = z.infer<typeof ResumeOptimizationResultSchema>;

/**
 * Raw JSON Schema object passed to Gemini as `config.responseSchema`.
 * Must mirror ResumeOptimizationResultSchema so Gemini produces compliant JSON.
 */
export const RESUME_OPTIMIZATION_JSON_SCHEMA = {
  type: "OBJECT" as const,
  properties: {
    optimizedSummary: { type: "STRING" as const },
    optimizedExperience: {
      type: "ARRAY" as const,
      items: {
        type: "OBJECT" as const,
        properties: {
          company: { type: "STRING" as const },
          role: { type: "STRING" as const },
          location: { type: "STRING" as const },
          startDate: { type: "STRING" as const },
          endDate: { type: "STRING" as const },
          isCurrent: { type: "BOOLEAN" as const },
          optimizedHighlights: { type: "ARRAY" as const, items: { type: "STRING" as const } },
          technologies: { type: "ARRAY" as const, items: { type: "STRING" as const } },
        },
        required: ["company", "role", "startDate", "endDate", "isCurrent", "optimizedHighlights", "technologies"],
      },
    },
    optimizedProjects: {
      type: "ARRAY" as const,
      items: {
        type: "OBJECT" as const,
        properties: {
          name: { type: "STRING" as const },
          optimizedDescription: { type: "STRING" as const },
          role: { type: "STRING" as const },
          optimizedTechnologies: { type: "ARRAY" as const, items: { type: "STRING" as const } },
          optimizedHighlights: { type: "ARRAY" as const, items: { type: "STRING" as const } },
          link: { type: "STRING" as const },
        },
        required: ["name", "optimizedDescription", "optimizedTechnologies", "optimizedHighlights"],
      },
    },
    optimizedSkills: {
      type: "OBJECT" as const,
      properties: {
        technicalSkills: { type: "ARRAY" as const, items: { type: "STRING" as const } },
        frameworksAndLibraries: { type: "ARRAY" as const, items: { type: "STRING" as const } },
        toolsAndCloud: { type: "ARRAY" as const, items: { type: "STRING" as const } },
        softSkills: { type: "ARRAY" as const, items: { type: "STRING" as const } },
        languages: { type: "ARRAY" as const, items: { type: "STRING" as const } },
      },
      required: ["technicalSkills", "frameworksAndLibraries", "toolsAndCloud", "softSkills", "languages"],
    },
    keywordSuggestions: {
      type: "ARRAY" as const,
      items: {
        type: "OBJECT" as const,
        properties: {
          keyword: { type: "STRING" as const },
          context: { type: "STRING" as const },
          supportedByResume: { type: "BOOLEAN" as const },
        },
        required: ["keyword", "context", "supportedByResume"],
      },
    },
    atsImprovements: { type: "ARRAY" as const, items: { type: "STRING" as const } },
    identifiedGaps: {
      type: "ARRAY" as const,
      items: {
        type: "OBJECT" as const,
        properties: {
          requirement: { type: "STRING" as const },
          resumeEvidence: { type: "STRING" as const },
          severity: { type: "STRING" as const, enum: ["critical", "major", "minor"] },
          recommendation: { type: "STRING" as const },
        },
        required: ["requirement", "resumeEvidence", "severity", "recommendation"],
      },
    },
    changes: {
      type: "ARRAY" as const,
      items: {
        type: "OBJECT" as const,
        properties: {
          section: { type: "STRING" as const, enum: ["professionalSummary", "workExperience", "projects", "skills", "ats"] },
          title: { type: "STRING" as const },
          originalText: { type: "STRING" as const },
          suggestedText: { type: "STRING" as const },
          reason: { type: "STRING" as const },
          confidence: { type: "STRING" as const, enum: ["high", "medium", "low"] },
        },
        required: ["section", "title", "originalText", "suggestedText", "reason", "confidence"],
      },
    },
    warnings: { type: "ARRAY" as const, items: { type: "STRING" as const } },
  },
  required: ["optimizedSummary", "optimizedExperience", "optimizedProjects", "optimizedSkills", "keywordSuggestions", "atsImprovements", "identifiedGaps", "changes", "warnings"],
};

