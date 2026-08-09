import type { Chapter, ChapterFilterOptions } from "@/types/chapter.types";

/**
 * Client-side filtering of the hydrated chapters list. The API accepts the
 * same filters server-side, but the dashboard fetches one page and applies
 * the active filters in memory.
 */
export function applyChapterFilters(chapters: Chapter[], filters: ChapterFilterOptions): Chapter[] {
  // Loop-invariant: the lowercased query depends on filters, not on the chapter.
  const searchLower = filters.search?.toLowerCase();
  return chapters.filter((chapter) => {
    if (filters.status && !filters.status.includes(chapter.status)) return false;
    if (filters.region && !filters.region.includes(chapter.location.region)) return false;
    if (filters.country && !filters.country.includes(chapter.location.country)) return false;
    if (filters.memberCountRange) {
      const { min, max } = filters.memberCountRange;
      if (chapter.memberCount < min || chapter.memberCount > max) return false;
    }
    if (filters.leadershipRole && filters.leadershipRole.length > 0) {
      const hasRole = chapter.leadership.some((leader) =>
        filters.leadershipRole!.includes(leader.role),
      );
      if (!hasRole) return false;
    }
    if (searchLower) {
      return (
        chapter.displayName.toLowerCase().includes(searchLower) ||
        chapter.name.toLowerCase().includes(searchLower) ||
        chapter.location.city.toLowerCase().includes(searchLower) ||
        chapter.location.state.toLowerCase().includes(searchLower) ||
        (chapter.description && chapter.description.toLowerCase().includes(searchLower))
      );
    }
    return true;
  });
}
