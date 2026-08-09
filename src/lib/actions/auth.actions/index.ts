// No "use server" here: Turbopack rejects re-exports from directive files
// ("Only async functions are allowed to be exported in a 'use server' file").
// Each implementation module below carries the directive itself.

/**
 * Auth server actions barrel.
 *
 * Keeps "@/lib/actions/auth.actions" resolving after the old monolithic
 * src/lib/actions/auth.actions.ts was split into this directory:
 *
 *   - credentials.ts login and signup against better-auth credentials
 *   - password.ts    forgot/reset/change password flows
 *   - profile.ts     current-user read and profile update
 *   - sessions.ts    session listing, revocation and sign-out
 *   - account.ts     account deletion
 *   - mappers.ts     better-auth user -> SafeUser mapping (internal)
 */

// TODO: Implement proper Better Auth API calls once the correct API surface is identified
// TODO: Add proper session management functions
// TODO: Add comprehensive error handling for edge cases

export { loginAction, signupAction } from "./credentials";
export { changePasswordAction, forgotPasswordAction, resetPasswordAction } from "./password";
export { getCurrentUserAction, updateProfileAction } from "./profile";
export {
  getUserSessionsAction,
  logoutAction,
  revokeAllOtherSessionsAction,
  revokeOtherSessionsAction,
  revokeSessionAction,
  signOutAction,
} from "./sessions";
export { deleteAccountAction } from "./account";
