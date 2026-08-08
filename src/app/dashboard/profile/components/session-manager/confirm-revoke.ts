// Confirmation prompt guarding the "revoke all other sessions" action. The
// native confirm() dialog matches the destructive-action pattern used
// elsewhere in the app (e.g. certificate revocation).
export function confirmRevokeAllOtherSessions(): boolean {
  return confirm(
    "Are you sure you want to revoke all other sessions? This will sign you out from all other devices.",
  );
}
