import type { Chapter } from "@/types/chapter.types";

import type { WireChapter } from "./types";

/** ISO strings from the API parse to Date; empty or invalid values fall back. */
function toDate(value: string | null | undefined, fallback: Date): Date {
  if (!value) return fallback;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

/** Hydrates a wire chapter (ISO date strings) into the UI Chapter shape. */
export function hydrateChapter(raw: WireChapter): Chapter {
  const createdAt = toDate(raw.createdAt, new Date());
  return {
    ...raw,
    establishedDate: toDate(raw.establishedDate, createdAt),
    createdAt,
    updatedAt: toDate(raw.updatedAt, createdAt),
    leadership: (raw.leadership ?? []).map((leader) => ({
      ...leader,
      startDate: toDate(leader.startDate, createdAt),
      endDate: leader.endDate ? toDate(leader.endDate, createdAt) : undefined,
    })),
  };
}
