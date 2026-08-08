import type { Media, MediaFilters } from "@/types/media";

/**
 * Client-side filtering of the real upload manifest (backlog F2): only fields
 * that actually exist on uploaded records are filterable — there is no search
 * index, folder store, or tag store yet.
 */
export function applyMediaFilters(items: Media[], filters: MediaFilters): Media[] {
  let result = items;

  if (filters.search) {
    const needle = filters.search.toLowerCase();
    result = result.filter(
      (item) =>
        item.title.toLowerCase().includes(needle) ||
        item.description?.toLowerCase().includes(needle),
    );
  }
  if (filters.type && filters.type.length > 0) {
    result = result.filter((item) => filters.type!.includes(item.type));
  }
  if (filters.status && filters.status.length > 0) {
    result = result.filter((item) => filters.status!.includes(item.status));
  }
  if (filters.visibility && filters.visibility.length > 0) {
    result = result.filter((item) => filters.visibility!.includes(item.visibility));
  }
  if (filters.createdBy && filters.createdBy.length > 0) {
    result = result.filter((item) => filters.createdBy!.includes(item.createdBy));
  }
  if (filters.dateRange) {
    const start = filters.dateRange.start.getTime();
    const end = filters.dateRange.end.getTime();
    result = result.filter((item) => {
      const created = new Date(item.createdAt).getTime();
      return created >= start && created <= end;
    });
  }
  if (filters.sizeRange) {
    const { min, max } = filters.sizeRange;
    result = result.filter((item) => item.metadata.size >= min && item.metadata.size <= max);
  }

  const sortBy = filters.sortBy ?? "createdAt";
  const sortOrder = filters.sortOrder ?? "desc";
  const sortValue = (item: Media): string | number => {
    switch (sortBy) {
      case "title":
        return item.title.toLowerCase();
      case "size":
        return item.metadata.size;
      case "type":
        return item.type;
      case "updatedAt":
        return new Date(item.updatedAt).getTime();
      case "views":
      case "downloads":
      case "usage":
        // No usage-analytics store exists yet; every record honestly ties.
        return 0;
      default:
        return new Date(item.createdAt).getTime();
    }
  };
  result = [...result].sort((a, b) => {
    const left = sortValue(a);
    const right = sortValue(b);
    const comparison = left < right ? -1 : left > right ? 1 : 0;
    return sortOrder === "asc" ? comparison : -comparison;
  });

  return result;
}
