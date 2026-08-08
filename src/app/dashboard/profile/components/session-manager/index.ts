/**
 * Session manager barrel.
 *
 * Keeps "@/app/dashboard/profile/components/session-manager" resolving after
 * the old monolithic session-manager.tsx was split into this directory:
 *
 *   - session-manager.tsx SessionManager state, loading and composition
 *   - session-card.tsx    current-session card
 *   - session-row.tsx     one revocable session row
 *   - session-list.tsx    other-sessions card, revoke-all button, empty state
 *   - confirm-revoke.ts   revoke-all confirmation prompt
 *   - session-helpers.ts  device/browser/location/time formatting + payload transform
 *   - types.ts            shared SessionData and props types
 */
export { SessionManager } from "./session-manager";
