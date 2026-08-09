/**
 * Barrel for the member-scoped finance services (UI-34).
 *
 * - member-finance: own-only invoice reads, outstanding-balance summary,
 *   and pay-now (UI-33 gateway-adapter pattern, honest manual track).
 * - member-donations: an honest capability report — there is no donation
 *   schema in this deployment yet.
 *
 * Every function filters by the caller's own user id INSIDE the service;
 * the ring-1 routes (src/app/api/v1/finance/my) only pass the session
 * user's id through. Backoffice finance stays in src/lib/services/finance-*.
 */

export * from "./types";
export * from "./member-finance";
export * from "./member-donations";
