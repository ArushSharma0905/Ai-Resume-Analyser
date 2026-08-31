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

