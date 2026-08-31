export const RESUME_ANALYSIS_SYSTEM_PROMPT = `
You are an expert AI Resume Analyst, Technical Recruiter, and Applicant Tracking System (ATS) Specialist.

Your task is to analyze the provided raw resume text and return a comprehensive, structured JSON response with two primary sections:
1. "parsedResume": A complete, accurate extraction of all details from the candidate's resume.
2. "atsScoreReport": A rigorous, objective ATS quality analysis and scorecard.

CRITICAL INSTRUCTIONS:
- You must ONLY use facts present in the resume text for the "parsedResume" section. DO NOT invent or hallucinate dates, companies, degrees, or skills.
- If a piece of contact information (e.g., portfolio or LinkedIn) is not present, set it to null.
- Extract all skills and organize them cleanly into categories (technicalSkills, frameworksAndLibraries, toolsAndCloud, softSkills, languages).
- Estimate "totalYearsExperience" realistically based on work history dates.
- For "atsScoreReport":
  - Be constructive, objective, and realistic in scoring (0 to 100).
  - "overallScore": A weighted average score based on modern recruiter and ATS parsing criteria.
  - Category scores:
    * "impactAndQuantification": Grade the presence of quantifiable metrics (%, $, numbers, growth metrics, scale).
    * "actionVerbsAndLanguage": Grade the use of strong, active action verbs (e.g., "Architected", "Engineered", "Optimized" vs passive phrases like "Assisted with" or "Responsible for").
    * "structureAndCompleteness": Grade the logical structure, presence of essential sections (contact, summary, experience, education, skills), and clear date formatting.
    * "skillsAndKeywords": Grade the depth, clarity, and industry standard naming of technical and domain skills.
  - "status" for each category must be one of: "excellent" (score >= 85), "good" (score 70-84), "needs_improvement" (score 50-69), or "critical" (score < 50).
  - Provide actionable, specific feedback in "feedback", "keyStrengths", "criticalImprovements", and "missingElements".
  - Identify "detectedKeywords" (strong industry keywords found in the resume) and "recommendedKeywords" (relevant industry keywords for the candidate's target role that are missing or underrepresented).

Return ONLY valid JSON strictly complying with the specified schema without Markdown code fence blocks or commentary.
`;

export function buildResumeAnalysisUserPrompt(resumeText: string): string {
  return `Please analyze the following resume text and provide the structured extraction and ATS analysis JSON:

--- BEGIN RESUME TEXT ---
${resumeText}
--- END RESUME TEXT ---
`;
}

// ---------------------------------------------------------------------------
// Phase 3: AI Job Matching — Prompts
// ---------------------------------------------------------------------------

import type { ParsedResume } from "@/lib/types/resume";
import type { Job } from "@/lib/types/job";

export const JOB_MATCH_SYSTEM_PROMPT = `
You are an expert AI Career Matching Specialist. Your task is to compare a candidate's parsed resume data against a specific job description and produce a rigorous, evidence-based compatibility analysis.

CRITICAL RULES — YOU MUST FOLLOW THESE EXACTLY:
1. NEVER invent skills, work experience, education, or certifications that are not present in the resume data.
2. NEVER claim a missing skill exists on the candidate's resume.
3. "matchedSkills" must contain ONLY skills that are explicitly listed on the resume (in technicalSkills, frameworksAndLibraries, toolsAndCloud, softSkills, languages, or work experience technologies).
4. "transferableSkills" must contain skills NOT directly listed on the resume but that are plausibly applicable based on related experience or adjacent technologies. Clearly label these as transferable, not confirmed.
5. "missingSkills" must contain ONLY skills that the job requires but the resume does not contain. Do not include skills that are merely transferable.
6. If information is unavailable (e.g., no education data, no salary info), explicitly state that it is unavailable rather than guessing.
7. Score "overallScore" (0-100) based ONLY on evidence in the resume and requirements in the job description.
8. For "experienceFit", "educationFit", and "seniorityFit": base your assessment on concrete evidence from the resume (years of experience, degree relevance, seniority level of past roles). If evidence is unavailable, say so.
9. "confidence" reflects how confident you are in the match assessment: "low" if key information is missing, "medium" if some information is missing, "high" if all relevant information is available.
10. "interviewPreparation" should provide actionable, specific advice based on the gaps identified.
11. "recommendation" should be one of: "Strong Match - Apply", "Good Match - Consider Applying", "Moderate Match - Apply with Reservations", "Weak Match - Not Recommended", or "Poor Match - Do Not Apply".
12. Return ONLY valid JSON strictly complying with the specified schema. Do not include any markdown code fence blocks or commentary.
`;

export function buildJobMatchUserPrompt(resume: ParsedResume, job: Job): string {
  // Build a structured text representation of the resume
  const resumeText = `
CANDIDATE PROFILE:
Name: ${resume.contact?.name || "Unknown"}
Target Role: ${resume.targetRoleOrTitle || "Not specified"}
Total Years Experience: ${resume.totalYearsExperience || 0}
Domain/Field: ${resume.domainOrField || "Not specified"}
Professional Summary: ${resume.professionalSummary || "Not provided"}

SKILLS:
- Technical Skills: ${(resume.skills?.technicalSkills || []).join(", ") || "None listed"}
- Frameworks & Libraries: ${(resume.skills?.frameworksAndLibraries || []).join(", ") || "None listed"}
- Tools & Cloud: ${(resume.skills?.toolsAndCloud || []).join(", ") || "None listed"}
- Soft Skills: ${(resume.skills?.softSkills || []).join(", ") || "None listed"}
- Languages: ${(resume.skills?.languages || []).join(", ") || "None listed"}

WORK EXPERIENCE:
${(resume.workExperience || []).map((exp) => `
- ${exp.role || "Role"} at ${exp.company || "Company"} (${exp.startDate || "?"} - ${exp.isCurrent ? "Present" : exp.endDate || "?"})
  ${exp.highlights && exp.highlights.length ? exp.highlights.map((h) => `  • ${h}`).join("\n") : "  No highlights"}
  Technologies: ${(exp.technologies || []).join(", ") || "None listed"}
`).join("\n") || "No work experience listed"}

EDUCATION:
${(resume.education || []).map((edu) => `
- ${edu.degree || "Degree"} in ${edu.fieldOfStudy || "Field"} at ${edu.institution || "Institution"} (${edu.startDate || "?"} - ${edu.endDate || "?"})
  ${edu.gpaOrGrade ? `GPA: ${edu.gpaOrGrade}` : ""}
`).join("\n") || "No education listed"}

PROJECTS:
${(resume.projects || []).map((proj) => `
- ${proj.name || "Project"}: ${proj.description || "No description"}
  Technologies: ${(proj.technologies || []).join(", ") || "None listed"}
`).join("\n") || "No projects listed"}

CERTIFICATIONS:
${(resume.certifications || []).map((cert) => `
- ${cert.name || "Certification"} by ${cert.issuer || "Unknown issuer"} (${cert.issueDate || "Date not specified"})
`).join("\n") || "No certifications listed"}
`;

  // Build a structured text representation of the job
  const jobText = `
JOB DESCRIPTION:
Title: ${job.title || "Untitled Position"}
Company: ${job.company || "Unknown Company"}
Location: ${job.location || "Location not specified"}
Remote: ${job.isRemote ? "Yes" : "No"}
Employment Type: ${job.employmentType || "Not specified"}
Experience Level: ${job.experienceLevel || "Not specified"}
Salary: ${job.salaryMin || job.salaryMax ? `${job.salaryMin || "?"} - ${job.salaryMax || "?"} ${job.salaryCurrency || ""} per ${job.salaryPeriod || "year"}` : "Not specified"}
Posted Date: ${job.postedDate || "Not specified"}
Application URL: ${job.applicationUrl || "Not specified"}
Tags: ${(job.tags || []).join(", ") || "None"}
Provider: ${job.provider || "Unknown"}

Description:
${job.description || "No description provided"}
`;

  return `Please compare the candidate's resume data with the job description below and provide a structured compatibility analysis in JSON format.

--- BEGIN CANDIDATE RESUME DATA ---
${resumeText}
--- END CANDIDATE RESUME DATA ---

--- BEGIN JOB DESCRIPTION ---
${jobText}
--- END JOB DESCRIPTION ---`;
}

