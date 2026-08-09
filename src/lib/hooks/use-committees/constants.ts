/** Base route for the committees API; item routes append `/${id}`. */
export const COMMITTEES_API_PATH = "/api/v1/committees";

/** Page size the dashboard requests from the committees list endpoint. */
export const COMMITTEES_PAGE_LIMIT = 100;

/** React Query key prefix shared by the committees queries and their invalidations. */
export const COMMITTEES_QUERY_KEY = ["committees"];
