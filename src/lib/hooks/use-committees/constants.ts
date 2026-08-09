/** Base route for the committees API; item routes append `/${id}`. */
export const COMMITTEES_API_PATH = "/api/v1/committees";

/** React Query key prefix shared by the committees queries and their invalidations. */
export const COMMITTEES_QUERY_KEY = ["committees"];
