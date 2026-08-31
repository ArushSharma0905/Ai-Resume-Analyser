export interface ContactInfo {
  name: string;
  email: string | null;
  phone: string | null;
  location: string | null;
  linkedin: string | null;
  github: string | null;
  portfolio: string | null;
}

export interface SkillGroup {
  technicalSkills: string[];
  frameworksAndLibraries: string[];
  toolsAndCloud: string[];
  softSkills: string[];
  languages: string[];
}

export interface WorkExperienceItem {
  company: string;
  role: string;
  location?: string | null;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  highlights: string[];
  technologies: string[];
}

export interface EducationItem {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate?: string | null;
  endDate?: string | null;
  gpaOrGrade?: string | null;
  highlights?: string[];
}

export interface ProjectItem {
  name: string;
  description: string;
  role?: string | null;
  technologies: string[];
  link?: string | null;
  highlights: string[];
}

export interface CertificationItem {
  name: string;
  issuer: string;
  issueDate?: string | null;
  credentialId?: string | null;
}

export interface ParsedResume {
  contact: ContactInfo;
  professionalSummary: string;
  targetRoleOrTitle: string;
  totalYearsExperience: number;
  domainOrField: string;
  skills: SkillGroup;
  workExperience: WorkExperienceItem[];
  education: EducationItem[];
  projects: ProjectItem[];
  certifications: CertificationItem[];
}

export type AtsCategoryStatus = 'excellent' | 'good' | 'needs_improvement' | 'critical';

export interface AtsScoreCategory {
  score: number; // 0 - 100
  title: string;
  status: AtsCategoryStatus;
  feedback: string[];
}

export interface AtsScoreReport {
  overallScore: number; // 0 - 100
  summary: string;
  breakdown: {
    impactAndQuantification: AtsScoreCategory;
    actionVerbsAndLanguage: AtsScoreCategory;
    structureAndCompleteness: AtsScoreCategory;
    skillsAndKeywords: AtsScoreCategory;
  };
  keyStrengths: string[];
  criticalImprovements: string[];
  missingElements: string[];
  detectedKeywords: string[];
  recommendedKeywords: string[];
}

export interface ResumeAnalysisResult {
  parsedResume: ParsedResume;
  atsScoreReport: AtsScoreReport;
  rawTextLength: number;
}
