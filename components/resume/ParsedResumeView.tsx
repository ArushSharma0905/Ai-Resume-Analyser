"use client";

import React from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  Briefcase,
  GraduationCap,
  FolderGit2,
  Award,
  Layers,
  Calendar,
  ExternalLink,
  Code2,
} from "lucide-react";
import type { ParsedResume } from "@/lib/types/resume";

interface ParsedResumeViewProps {
  resume: ParsedResume;
}

export default function ParsedResumeView({ resume }: ParsedResumeViewProps) {
  const {
    contact,
    professionalSummary,
    targetRoleOrTitle,
    totalYearsExperience,
    domainOrField,
    skills,
    workExperience,
    education,
    projects,
    certifications,
  } = resume;

  return (
    <div className="space-y-6">
      {/* Header Profile Card */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-lg">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                  {contact.name || "Candidate"}
                </h2>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  {targetRoleOrTitle || "Professional"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 sm:self-start">
            {totalYearsExperience > 0 && (
              <span className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-full text-xs font-semibold">
                ~{totalYearsExperience} {totalYearsExperience === 1 ? "Year" : "Years"} Exp
              </span>
            )}
            {domainOrField && (
              <span className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-full text-xs font-semibold">
                {domainOrField}
              </span>
            )}
          </div>
        </div>

        {/* Contact Links & Badges */}
        <div className="flex flex-wrap gap-y-2 gap-x-4 pt-4 text-xs text-zinc-600 dark:text-zinc-400">
          {contact.email && (
            <div className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-zinc-400" />
              <a href={`mailto:${contact.email}`} className="hover:underline">
                {contact.email}
              </a>
            </div>
          )}
          {contact.phone && (
            <div className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-zinc-400" />
              <span>{contact.phone}</span>
            </div>
          )}
          {contact.location && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-zinc-400" />
              <span>{contact.location}</span>
            </div>
          )}
          {contact.linkedin && (
            <div className="flex items-center gap-1.5">
              <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
              <a
                href={contact.linkedin.startsWith("http") ? contact.linkedin : `https://${contact.linkedin}`}
                target="_blank"
                rel="noreferrer"
                className="hover:underline text-blue-600 dark:text-blue-400"
              >
                LinkedIn
              </a>
            </div>
          )}
          {contact.github && (
            <div className="flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5 text-zinc-400" />
              <a
                href={contact.github.startsWith("http") ? contact.github : `https://${contact.github}`}
                target="_blank"
                rel="noreferrer"
                className="hover:underline text-blue-600 dark:text-blue-400"
              >
                GitHub
              </a>
            </div>
          )}
          {contact.portfolio && (
            <div className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-zinc-400" />
              <a
                href={contact.portfolio.startsWith("http") ? contact.portfolio : `https://${contact.portfolio}`}
                target="_blank"
                rel="noreferrer"
                className="hover:underline text-blue-600 dark:text-blue-400"
              >
                Portfolio
              </a>
            </div>
          )}
        </div>

        {/* Professional Summary */}
        {professionalSummary && (
          <div className="mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800">
            <h3 className="text-xs font-semibold tracking-wider uppercase text-zinc-400 mb-2">
              Professional Summary
            </h3>
            <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
              {professionalSummary}
            </p>
          </div>
        )}
      </div>

      {/* Skills Matrix */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="flex items-center gap-2 mb-6 text-zinc-900 dark:text-zinc-100">
          <Layers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-bold">Extracted Skills Breakdown</h3>
        </div>

        <div className="space-y-4">
          {skills.technicalSkills && skills.technicalSkills.length > 0 && (
            <div>
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 block mb-2">
                Languages & Core Technologies
              </span>
              <div className="flex flex-wrap gap-1.5">
                {skills.technicalSkills.map((s, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-lg text-xs font-medium"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {skills.frameworksAndLibraries && skills.frameworksAndLibraries.length > 0 && (
            <div>
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 block mb-2">
                Frameworks & Libraries
              </span>
              <div className="flex flex-wrap gap-1.5">
                {skills.frameworksAndLibraries.map((s, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-medium"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {skills.toolsAndCloud && skills.toolsAndCloud.length > 0 && (
            <div>
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 block mb-2">
                Tools, Cloud & Infrastructure
              </span>
              <div className="flex flex-wrap gap-1.5">
                {skills.toolsAndCloud.map((s, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 rounded-lg text-xs font-medium"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {skills.softSkills && skills.softSkills.length > 0 && (
            <div>
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 block mb-2">
                Core Competencies & Practices
              </span>
              <div className="flex flex-wrap gap-1.5">
                {skills.softSkills.map((s, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-medium"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Work Experience */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="flex items-center gap-2 mb-6 text-zinc-900 dark:text-zinc-100">
          <Briefcase className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-bold">Work Experience</h3>
        </div>

        {workExperience && workExperience.length > 0 ? (
          <div className="space-y-6">
            {workExperience.map((exp, idx) => (
              <div
                key={idx}
                className={`relative pl-6 pb-6 ${
                  idx !== workExperience.length - 1 ? "border-l-2 border-zinc-200 dark:border-zinc-800" : ""
                }`}
              >
                {/* Timeline node */}
                <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-blue-600 border-4 border-white dark:border-zinc-900" />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                  <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    {exp.role}
                  </h4>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      {exp.startDate} - {exp.isCurrent ? "Present" : exp.endDate}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 mb-3">
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    {exp.company}
                  </span>
                  {exp.location && <span>• {exp.location}</span>}
                </div>

                {exp.highlights && exp.highlights.length > 0 && (
                  <ul className="space-y-1.5 text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 mb-3">
                    {exp.highlights.map((bullet, bIdx) => (
                      <li key={bIdx} className="flex items-start gap-2">
                        <span className="text-blue-500 font-bold mt-1">•</span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {exp.technologies && exp.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {exp.technologies.map((t, tIdx) => (
                      <span
                        key={tIdx}
                        className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded text-[11px]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">No work experience entries extracted.</p>
        )}
      </div>

      {/* Education & Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Education */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-4 text-zinc-900 dark:text-zinc-100">
            <GraduationCap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-base font-bold">Education</h3>
          </div>

          {education && education.length > 0 ? (
            <div className="space-y-4">
              {education.map((edu, idx) => (
                <div key={idx} className="border-b last:border-0 border-zinc-100 dark:border-zinc-800 pb-3 last:pb-0">
                  <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {edu.degree} {edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ""}
                  </h4>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    {edu.institution}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500">
                    {(edu.startDate || edu.endDate) && (
                      <span>{edu.startDate ? `${edu.startDate} - ` : ""}{edu.endDate || ""}</span>
                    )}
                    {edu.gpaOrGrade && <span>• {edu.gpaOrGrade}</span>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-zinc-500">No education entries extracted.</p>
          )}
        </div>

        {/* Projects */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-4 text-zinc-900 dark:text-zinc-100">
            <FolderGit2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-base font-bold">Projects</h3>
          </div>

          {projects && projects.length > 0 ? (
            <div className="space-y-4">
              {projects.map((proj, idx) => (
                <div key={idx} className="border-b last:border-0 border-zinc-100 dark:border-zinc-800 pb-3 last:pb-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {proj.name}
                    </h4>
                    {proj.link && (
                      <a
                        href={proj.link.startsWith("http") ? proj.link : `https://${proj.link}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        View Link
                      </a>
                    )}
                  </div>
                  {proj.description && (
                    <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1 leading-relaxed">
                      {proj.description}
                    </p>
                  )}
                  {proj.technologies && proj.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {proj.technologies.map((t, tIdx) => (
                        <span
                          key={tIdx}
                          className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded text-[10px]"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-zinc-500">No project entries extracted.</p>
          )}
        </div>
      </div>

      {/* Certifications (if present) */}
      {certifications && certifications.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-4 text-zinc-900 dark:text-zinc-100">
            <Award className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-base font-bold">Certifications</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {certifications.map((cert, idx) => (
              <div key={idx} className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {cert.name}
                </h4>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                  {cert.issuer} {cert.issueDate ? `• ${cert.issueDate}` : ""}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
