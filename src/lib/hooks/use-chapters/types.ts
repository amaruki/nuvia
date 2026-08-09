import type { Chapter, ChapterLeadership } from "@/types/chapter.types";

// ---------------------------------------------------------------------------
// Wire shapes (ISO date strings) returned by /api/v1/chapters
// ---------------------------------------------------------------------------

/** Wire shape of a leadership seat: term dates arrive as ISO strings. */
export interface WireLeadership extends Omit<ChapterLeadership, "startDate" | "endDate"> {
  startDate: string;
  endDate?: string | null;
}

/** Wire shape returned by /api/v1/chapters: Chapter with ISO date strings. */
export interface WireChapter extends Omit<
  Chapter,
  "establishedDate" | "createdAt" | "updatedAt" | "leadership"
> {
  establishedDate: string;
  createdAt: string;
  updatedAt: string;
  leadership: WireLeadership[];
}
