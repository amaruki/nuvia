import type { EngagementBadge } from "./types";

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-US").format(num);
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function getEngagementColor(score: number): string {
  if (score >= 85) return "text-emerald-600";
  if (score >= 70) return "text-amber-600";
  return "text-rose-600";
}

export function getEngagementBadge(score: number): EngagementBadge {
  if (score >= 85)
    return {
      className: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
      text: "Excellent",
    };
  if (score >= 70)
    return { className: "bg-amber-100 text-amber-700 hover:bg-amber-100", text: "Good" };
  return { className: "bg-rose-100 text-rose-700 hover:bg-rose-100", text: "Needs Improvement" };
}

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case "urgent":
      return "text-red-600";
    case "high":
      return "text-amber-600";
    case "medium":
      return "text-blue-600";
    default:
      return "text-slate-600";
  }
}
