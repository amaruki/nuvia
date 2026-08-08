/**
 * Consolidated Better Auth barrel.
 *
 * Keeps "@/lib/auth" resolving after the old monolithic src/lib/auth.ts was
 * split into this directory. The Better Auth instance is assembled in
 * ./core.ts from the seam modules:
 *
 *   - session.ts     session lifetime, cookie policy, revocation cache hook
 *   - tokens.ts      password-reset / email-verification token lifecycle
 *   - permissions.ts user fields (role protection) and account deletion
 *   - helpers.ts     env validation, username generation, OAuth mapping
 *   - email.ts       email delivery service + transactional templates
 *
 * The pre-existing siblings (utils.ts, common.ts, middleware.ts,
 * login-activity.ts) are intentionally NOT re-exported here: their
 * importers already use "@/lib/auth/<file>" directly, and utils.ts imports
 * this barrel itself, so re-exporting it would create a cycle.
 */

export { auth } from "./core";
export { emailService, emailTemplates } from "./email";
export { passwordUtils } from "./helpers";
