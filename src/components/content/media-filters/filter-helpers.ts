import type { MediaFilters } from "@/types/media";

export function hasActiveFilters(filters: MediaFilters): boolean {
  return !!(
    filters.search ||
    filters.type?.length ||
    filters.status?.length ||
    filters.visibility?.length ||
    filters.tags?.length ||
    filters.dateRange ||
    filters.sizeRange
  );
}

export function toggleArrayValue<T>(current: T[] | undefined, value: T): T[] | undefined {
  const next = current?.includes(value)
    ? current.filter((item) => item !== value)
    : [...(current ?? []), value];

  return next.length > 0 ? next : undefined;
}
