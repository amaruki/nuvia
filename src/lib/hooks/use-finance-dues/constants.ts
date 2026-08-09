/** React Query key shared by the dues ledger query and its invalidations. */
export const DUES_LEDGER_QUERY_KEY = ["finance", "dues-ledger"];

/** React Query key shared by the payments query and its invalidations. */
export const PAYMENTS_QUERY_KEY = ["finance", "payments"];

/** Finance-wide prefix invalidated after any dues or payment mutation. */
export const FINANCE_QUERY_KEY = ["finance"];

/** Dues ledger route (report computed from membership invoices). */
export const DUES_REPORT_PATH = "/api/v1/finance/reports/dues";

/** Payments list/record route. */
export const PAYMENTS_API_PATH = "/api/v1/finance/payments";

/** Base route for invoice actions; void appends `/${id}/void`. */
export const INVOICES_API_PATH = "/api/v1/finance/invoices";

/** Page size the dashboard requests from the dues and payments endpoints. */
export const DUES_PAGE_LIMIT = 100;
