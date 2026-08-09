import { apiFetch } from "@/lib/api-client";

/**
 * Per-request page size when draining a list endpoint. The org list APIs
 * accept any limit, but requests stay bounded and parallel-friendly.
 */
export const FULL_SCAN_PAGE_SIZE = 100;

/**
 * Drains every page of a paginated list endpoint, replacing the legacy
 * single-page `limit=100` fetches that silently capped dashboard hooks
 * (UI-09 C3). Pages are fetched sequentially until `meta.totalPages` is
 * reached, so overview/analytics/leadership tabs always see the full
 * dataset regardless of how many rows exist.
 */
export async function fetchAllPages<T>(
  path: string,
  params: URLSearchParams = new URLSearchParams(),
): Promise<T[]> {
  const all: T[] = [];
  let page = 1;

  for (;;) {
    const query = new URLSearchParams(params);
    query.set("page", String(page));
    query.set("limit", String(FULL_SCAN_PAGE_SIZE));

    const envelope = await apiFetch<T[]>(`${path}?${query.toString()}`);
    const items = envelope.data ?? [];
    all.push(...items);

    const totalPages = envelope.meta?.totalPages ?? 1;
    if (items.length === 0 || page >= totalPages) {
      return all;
    }
    page += 1;
  }
}
