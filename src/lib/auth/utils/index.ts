/**
 * Consolidated authentication utilities (barrel).
 *
 * This folder is the split of the former monolithic src/lib/auth/utils.ts;
 * "@/lib/auth/utils" keeps resolving to this module. Helpers are grouped by
 * concern:
 *
 *   - types.ts      shared result/data types
 *   - session.ts    session/user access, authentication gates, sign-out
 *   - roles.ts      role validation
 *   - profile.ts    profile updates
 *   - password.ts   password change
 *   - account.ts    account deletion
 *   - admin.ts      admin user management
 *   - auth-utils.ts AuthUtils facade class preserving the historical API
 *
 * Only modules inside this folder are re-exported: the sibling modules in
 * src/lib/auth (core, common, middleware, ...) are intentionally excluded.
 */

export type { AuthResult } from "./types";
export { AuthUtils } from "./auth-utils";
export { getCurrentSession, getCurrentUser, isAuthenticated, requireAuth } from "./session";
