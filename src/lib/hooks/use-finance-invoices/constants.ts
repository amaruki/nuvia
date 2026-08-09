/** React Query key shared by the invoices dashboard list query and invalidations. */
export const INVOICES_QUERY_KEY = ["finance", "dashboard-invoices"];

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

/** Page size the dashboard requests from the invoices and payments endpoints. */
export const INVOICES_PAGE_LIMIT = 100;
