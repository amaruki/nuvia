/**
 * Demo-mode constants (UI-39 — docs/planning/03-frontend-improvement-plan.md
 * L137-141). Shared by the seed/reset scripts, the demo login route, the
 * navigation role lists and their tests, so the disposable account's
 * identity is defined exactly once.
 *
 * The demo role is deliberately a CUSTOM role: it is absent from
 * dashboard.types.ts's USER_ROLES array, so isPredefinedRole("demo") is
 * false, role pickers never offer it, and no predefined-role permission map
 * silently grants it anything. Its permissions live in the custom_roles row
 * scripts/seed-demo.ts inserts (read-only set).
 */

export const DEMO_ROLE = "demo" as const;
export type DemoRole = typeof DEMO_ROLE;

/** Disposable account identity — never one of the seeded admins. */
export const DEMO_USER_EMAIL = "demo@nuvia.test";
export const DEMO_USER_USERNAME = "demo_user";
export const DEMO_USER_NAME = "Demo Visitor";

/**
 * Every user the demo seed creates lives under this domain, which is how
 * scripts/seed-demo.ts's wipe pass finds them again. *.test is reserved for
 * documentation (RFC 2606), so it can never collide with a real mailbox.
 */
export const DEMO_DOMAIN = "nuvia.test";
