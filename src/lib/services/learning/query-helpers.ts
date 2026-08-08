// ---------------------------------------------------------------------------
// Query helpers
// ---------------------------------------------------------------------------

export interface CourseListFilters {
  search?: string;
  category?: string;
  level?: string;
  page?: number;
  limit?: number;
}

export interface CertificateListFilters {
  search?: string;
  status?: string;
  courseId?: string;
  page?: number;
  limit?: number;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function paginate(
  page?: number,
  limit?: number,
): { page: number; limit: number; offset: number } {
  const safePage = Math.max(1, Math.trunc(page ?? 1));
  const safeLimit = Math.min(100, Math.max(1, Math.trunc(limit ?? 20)));
  return { page: safePage, limit: safeLimit, offset: (safePage - 1) * safeLimit };
}
