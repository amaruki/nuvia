/**
 * React Query key prefix for the donations table query. The active
 * page/pageSize params are appended by the query so each page caches
 * separately.
 */
export const DONATIONS_QUERY_KEY = ["finance", "donations"];

/** React Query key for the bounded aggregate window (statistics + overview). */
export const DONATIONS_WINDOW_QUERY_KEY = ["finance", "donations", "window"];

/** Finance-wide prefix invalidated after any donation mutation. */
export const FINANCE_QUERY_KEY = ["finance"];

/** Donations list/detail/create/update route. */
export const DONATIONS_API_PATH = "/api/v1/finance/donations";

/**
 * Row cap for the aggregate window. The list endpoint caps `limit` at 100,
 * so statistics and the overview cards describe the 100 most recent
 * donations (documented cap, newest-first). The table itself paginates
 * over the full list via the server, so nothing is silently truncated there.
 */
export const STATISTICS_WINDOW_LIMIT = 100;
