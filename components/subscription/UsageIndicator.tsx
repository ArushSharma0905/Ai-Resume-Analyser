"use client";

import React from "react";
import { AlertTriangle, Lock } from "lucide-react";

interface UsageIndicatorProps {
  label: string;
  used: number;
  limit: number;
  onUpgradeClick?: () => void;
  showWarning?: boolean;
  /**
   * Human label for the quota period, used in the limit/progress copy.
   * Defaults to "Monthly" (existing behavior for monthly feature quotas).
   * The rolling resume-analysis quota passes "7-day rolling".
   */
  periodLabel?: string;
}

export default function UsageIndicator({
  label,
  used,
  limit,
  onUpgradeClick,
  showWarning = false,
  periodLabel = "Monthly",
}: UsageIndicatorProps) {
  const isUnlimited = limit === Infinity || limit === -1;
  const isAtLimit = used >= limit && !isUnlimited;
  const percentage = isUnlimited ? 0 : Math.min(100, (used / limit) * 100);
  const isNearLimit = percentage >= 80 && percentage < 100 && !isUnlimited;

  const barColor = isAtLimit
    ? "bg-rose-500"
    : isNearLimit || showWarning
    ? "bg-amber-500"
    : "bg-blue-500";

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {label}
          </span>
          {showWarning && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
        </div>
        <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
          {isUnlimited ? "Unlimited" : `${used} / ${limit} used`}
        </span>
      </div>

      {!isUnlimited && (
        <div className="h-2 w-full bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 rounded-full ${barColor}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}

      {isAtLimit && onUpgradeClick && (
        <button
          onClick={onUpgradeClick}
          className="flex items-center gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 transition-colors"
        >
          <Lock className="w-3 h-3" />
          <span>{periodLabel} limit reached — upgrade to continue</span>
        </button>
      )}

      {isNearLimit && !isAtLimit && (
        <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          Approaching your {periodLabel.toLowerCase()} limit
        </p>
      )}
    </div>
  );
}
