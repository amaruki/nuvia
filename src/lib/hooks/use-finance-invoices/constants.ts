/**
 * React Query key prefix for the invoices table query. The active
 * page/pageSize params are appended by the query so each page caches
 * separately.
 */
export const INVOICES_QUERY_KEY = ["finance", "dashboard-invoices"];

/** React Query key for the bounded aggregate window (statistics + overview). */
export const INVOICES_WINDOW_QUERY_KEY = ["finance", "dashboard-invoices", "window"];

/** React Query key shared by the payments query and its invalidations. */
export const PAYMENTS_QUERY_KEY = ["finance", "payments"];

/** Finance-wide prefix invalidated after any invoice or payment mutation. */
export const FINANCE_QUERY_KEY = ["finance"];

/** Invoices listing route (report join of invoice, member, tier and line items). */
export const INVOICES_REPORT_PATH = "/api/v1/finance/reports/invoices";

/** Base route for invoice actions; void appends `/${id}/void`. */
export const INVOICES_API_PATH = "/api/v1/finance/invoices";

/** Payments list/record route. */
export const PAYMENTS_API_PATH = "/api/v1/finance/payments";

/**
 * Row cap for the aggregate window. The report endpoint caps `limit` at 100,
 * so statistics and the overview cards describe the 100 most recent invoices
 * (documented cap, newest-first). The table itself paginates over the full
 * list via the server, so nothing is silently truncated there.
 */
export const STATISTICS_WINDOW_LIMIT = 100;

/**
 * Recent-payments window for the payments tab and detail modals (documented
 * cap; the endpoint paginates but these surfaces only show the latest rows).
 */
export const PAYMENTS_RECENT_LIMIT = 100;
