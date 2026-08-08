/**
 * Client-safe API prefix.
 *
 * This module MUST NOT import `@/lib/env`: client-side services
 * (src/lib/services/event/ and friends) import it, and they run in
 * the browser, where the server-only variables validated at `env.ts` module
 * evaluation (DATABASE_URL, BETTER_AUTH_SECRET, ...) do not exist — importing
 * `env` there crashes the page before it renders.
 *
 * Browser fetches are always same-origin, so a fixed relative prefix is
 * correct on every deployment.
 */
export const API_PREFIX = "/api/v1";
