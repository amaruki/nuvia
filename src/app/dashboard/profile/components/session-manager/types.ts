// Shared types for the session-manager components.

export interface SessionData {
  id: string;
  userId: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  lastAccessedAt: Date;
  token: string;
  isCurrent?: boolean;
}

export interface SessionManagerProps {
  // The profile page passes the useSession() user, but the manager loads its
  // own session data via server actions and never reads this prop — it stays
  // accepted for interface compatibility, typed unknown.
  user: unknown;
}
