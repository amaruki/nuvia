/**
 * Shared badge maps, filter option lists, and formatting helpers for the
 * award programs page parts.
 */

import { format } from "date-fns";
import type { AwardCategory, AwardProgram, AwardProgramStatus } from "@/types/award.types";

export const STATUS_BADGE_VARIANTS: Record<
  AwardProgramStatus,
  "default" | "secondary" | "outline"
> = {
  open: "default",
  draft: "outline",
  closed: "secondary",
  archived: "secondary",
};

export const CATEGORY_BADGE_CLASSES: Record<AwardCategory, string> = {
  achievement: "bg-purple-100 text-purple-800 border-purple-200",
  service: "bg-green-100 text-green-800 border-green-200",
  leadership: "bg-blue-100 text-blue-800 border-blue-200",
  innovation: "bg-orange-100 text-orange-800 border-orange-200",
  scholarship: "bg-indigo-100 text-indigo-800 border-indigo-200",
  lifetime_achievement: "bg-amber-100 text-amber-800 border-amber-200",
};

export const STATUS_OPTIONS: { value: AwardProgramStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
  { value: "archived", label: "Archived" },
];

export const CATEGORY_OPTIONS: { value: AwardCategory; label: string }[] = [
  { value: "achievement", label: "Achievement" },
  { value: "service", label: "Service" },
  { value: "leadership", label: "Leadership" },
  { value: "innovation", label: "Innovation" },
  { value: "scholarship", label: "Scholarship" },
  { value: "lifetime_achievement", label: "Lifetime Achievement" },
];

export function formatEnumLabel(value: string): string {
  return value.replace(/_/g, " ").replace(/^\w/, (char) => char.toUpperCase());
}

export function formatDateRange(program: AwardProgram): string {
  if (!program.openDate && !program.closeDate) return "—";
  const open = program.openDate ? format(program.openDate, "MMM d, yyyy") : "…";
  const close = program.closeDate ? format(program.closeDate, "MMM d, yyyy") : "…";
  return `${open} – ${close}`;
}
