/**
 * React Query key prefix for the budget transactions table query. The active
 * page/pageSize params are appended by the query so each page caches
 * separately.
 */
export const BUDGET_TRANSACTIONS_QUERY_KEY = ["finance", "budget-transactions"];

/** React Query key for the budget categories query (overview + form selects). */
export const BUDGET_CATEGORIES_QUERY_KEY = ["finance", "budget-categories"];

/** React Query key for the bounded aggregate window (overview cards). */
export const BUDGET_WINDOW_QUERY_KEY = ["finance", "budget-transactions", "window"];

/** Finance-wide prefix invalidated after any budget mutation. */
export const FINANCE_QUERY_KEY = ["finance"];

/** Budget categories list/create route. */
export const BUDGETS_API_PATH = "/api/v1/finance/budgets";

/** Budget transactions list/record route; status updates append `/${id}`. */
export const BUDGET_TRANSACTIONS_API_PATH = "/api/v1/finance/budget-transactions";

/**
 * Row cap for the aggregate window. The transactions endpoint caps `limit`
 * at 100, so the overview's transaction-derived figures describe the 100
 * most recent transactions (documented cap, newest-first). The table itself
 * paginates over the full list via the server, so nothing is silently
 * truncated there.
 */
export const STATISTICS_WINDOW_LIMIT = 100;
