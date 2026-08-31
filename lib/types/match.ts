export interface MatchResult {
  overallScore: number; // 0-100
  recommendation: string;
  summary: string;
  matchedSkills: string[];
  missingSkills: string[];
  transferableSkills: string[];
  experienceFit: string;
  educationFit: string;
  seniorityFit: string;
  strengths: string[];
  concerns: string[];
  interviewPreparation: string[];
  confidence: "low" | "medium" | "high";
}
