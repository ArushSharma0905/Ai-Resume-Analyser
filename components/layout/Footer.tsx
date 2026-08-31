"use client";

import React from "react";
import { FileCheck2, Sparkles, ShieldCheck } from "lucide-react";
import type { NavTab } from "./Navbar";

interface FooterProps {
  onSelectTab?: (tab: NavTab) => void;
}

export default function Footer({ onSelectTab }: FooterProps) {
  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 text-xs mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Column 1: Brand & Mission */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
                <FileCheck2 className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-base tracking-tight text-zinc-900 dark:text-zinc-50">
                ResumeAI
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm leading-relaxed">
              AI-powered resume quality analytics, ATS compatibility diagnostics, live job matching, and strictly grounded non-hallucinatory resume tailoring powered by Google Gemini.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-zinc-500">
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                Zero-Hallucination Safe
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                Gemini Intelligence
              </span>
            </div>
          </div>

          {/* Column 2: Platform Links */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
              Product Suite
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  type="button"
                  onClick={() => onSelectTab?.("dashboard")}
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer text-left"
                >
                  Dashboard Overview
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSelectTab?.("analyzer")}
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer text-left"
                >
                  Resume ATS Scorecard
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSelectTab?.("jobs")}
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer text-left"
                >
                  Live Job Discovery
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSelectTab?.("matches")}
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer text-left"
                >
                  AI Match & Gap Analyzer
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSelectTab?.("optimizer")}
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer text-left"
                >
                  Resume Optimizer
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Standards & Plans */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
              Resources & Pricing
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  type="button"
                  onClick={() => onSelectTab?.("pricing")}
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer text-left"
                >
                  Subscription Plans
                </button>
              </li>
              <li>
                <span className="text-zinc-400">PDF, DOCX, TXT Extractors</span>
              </li>
              <li>
                <span className="text-zinc-400">ATS Parsing Guidelines</span>
              </li>
              <li>
                <span className="text-zinc-400">Action Verbs & Metrics</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-zinc-500">
          <p>© {new Date().getFullYear()} ResumeAI SaaS Platform. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span>Client-side local parsing</span>
            <span>•</span>
            <span>No unverified claims</span>
            <span>•</span>
            <span>Gemini Flash Architecture</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
