// Shared types for the security-form components.

export interface SecurityFormProps {
  // The profile page passes the useSession() user, but the password change
  // authenticates through the session cookie via changePassword() and never
  // reads this prop — it stays accepted for interface compatibility, typed
  // unknown.
  user: unknown;
}
