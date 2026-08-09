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
  achievement: "bg-muted text-muted-foreground border-border",
  service: "bg-success/15 text-success border-success/25",
  leadership: "bg-info/15 text-info border-info/25",
  innovation: "bg-destructive/15 text-destructive border-destructive/25",
  scholarship: "bg-info/15 text-info border-info/25",
  lifetime_achievement: "bg-warning/15 text-warning border-warning/25",
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
