"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  FileCheck2,
  LayoutDashboard,
  FileText,
  Briefcase,
  Target,
  Wand2,
  CreditCard,
  Home as HomeIcon,
  Menu,
  X,
  UploadCloud,
  RotateCcw,
  ShieldCheck,
  LogOut,
  LogIn,
  UserPlus,
} from "lucide-react";
import type { ParsedResume } from "@/lib/types/resume";
import { useAuth } from "@/lib/context/AuthContext";

export type NavTab =
  | "landing"
  | "dashboard"
  | "analyzer"
  | "jobs"
  | "matches"
  | "optimizer"
  | "pricing";

interface NavbarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  parsedResume: ParsedResume | null;
  onUploadNew: () => void;
  matchesCount: number;
}

export default function Navbar({
  activeTab,
  onSelectTab,
  parsedResume,
  onUploadNew,
  matchesCount,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { user, profile, signOut, isLoading } = useAuth();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const navItems: {
    id: NavTab;
    label: string;
    icon: React.ElementType;
    badge?: string | number;
  }[] = [
    { id: "landing", label: "Overview", icon: HomeIcon },
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    {
      id: "analyzer",
      label: "Resume Analyzer",
      icon: FileText,
      badge: parsedResume ? "Active" : undefined,
    },
    { id: "jobs", label: "Job Search", icon: Briefcase },
    {
      id: "matches",
      label: "Matches",
      icon: Target,
      badge: matchesCount > 0 ? matchesCount : undefined,
    },
    { id: "optimizer", label: "Optimizer", icon: Wand2 },
    { id: "pricing", label: "Pricing", icon: CreditCard },
  ];

  const handleNavClick = (tab: NavTab) => {
    onSelectTab(tab);
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  };

  const handleSignOut = async () => {
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
    await signOut();
  };

  const displayName =
    profile?.full_name ||
    parsedResume?.contact?.name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "User";

  const userInitial = displayName.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleNavClick("landing")}
            className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-hidden"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-zinc-900 dark:text-zinc-50">
                  ResumeAI
                </span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/40">
                  SaaS
                </span>
              </div>
              <span className="hidden lg:inline-block text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                AI Career Intelligence
              </span>
            </div>
          </button>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-zinc-100/80 dark:bg-zinc-800/60 p-1 rounded-xl border border-zinc-200/50 dark:border-zinc-700/50">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  isActive
                    ? "bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs font-bold"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/50 dark:hover:bg-zinc-700/40"
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 ${
                    isActive ? "text-blue-600 dark:text-blue-400" : ""
                  }`}
                />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span
                    className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive
                        ? "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                        : "bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Action & User Controls */}
        <div className="flex items-center gap-2.5">
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40 rounded-full text-[11px] font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Gemini AI Grounded</span>
          </div>

          {parsedResume ? (
            <button
              type="button"
              onClick={onUploadNew}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors cursor-pointer"
              title="Upload new resume"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Resume</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleNavClick("analyzer")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Upload Resume</span>
            </button>
          )}

          {/* User Account / Profile Controls */}
          <div
            className="relative hidden sm:flex items-center pl-2 border-l border-zinc-200 dark:border-zinc-800"
            ref={dropdownRef}
          >
            {isLoading ? (
              <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
            ) : user ? (
              <>
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-700 text-white flex items-center justify-center text-xs font-bold shadow-xs hover:ring-2 hover:ring-blue-400 dark:hover:ring-blue-500 transition-all cursor-pointer"
                  title={displayName}
                  aria-label="User menu"
                >
                  {userInitial}
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 top-11 w-56 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800">
                      <p className="text-xs font-bold text-zinc-900 dark:text-zinc-50 truncate">
                        {displayName}
                      </p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                        {user.email}
                      </p>
                      <span className="inline-flex items-center mt-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-900/40">
                        Free Account
                      </span>
                    </div>

                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => handleNavClick("dashboard")}
                        className="w-full text-left px-4 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2 cursor-pointer"
                      >
                        <LayoutDashboard className="w-3.5 h-3.5" />
                        <span>My Dashboard</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleNavClick("matches")}
                        className="w-full text-left px-4 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2 cursor-pointer"
                      >
                        <Target className="w-3.5 h-3.5" />
                        <span>Saved Job Matches</span>
                      </button>
                    </div>

                    <div className="pt-1 border-t border-zinc-100 dark:border-zinc-800">
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2 cursor-pointer font-medium"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center gap-1.5">
                <Link
                  href="/login"
                  className="px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white rounded-lg transition-colors inline-flex items-center gap-1"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </Link>
                <Link
                  href="/signup"
                  className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40 rounded-lg text-xs font-bold hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors inline-flex items-center gap-1"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Sign Up</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-3 shadow-lg animate-in slide-in-from-top-2 duration-150">
          {/* User Status Bar in Mobile */}
          {user ? (
            <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5 truncate">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  {userInitial}
                </div>
                <div className="truncate">
                  <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                    {displayName}
                  </p>
                  <p className="text-[11px] text-zinc-500 truncate">{user.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                className="px-2.5 py-1 text-xs text-rose-600 dark:text-rose-400 font-bold hover:underline cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 text-center text-xs font-bold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 rounded-xl"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 text-center text-xs font-bold text-white bg-blue-600 rounded-xl shadow-xs"
              >
                Sign Up Free
              </Link>
            </div>
          )}

          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                    isActive
                      ? "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-bold"
                      : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
