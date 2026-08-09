/**
 * Shared types for the session cache.
 */

/**
 * Session cache interface
 */
export interface CachedSession {
  userId: string;
  sessionId: string;
  expiresAt: Date;
  user: {
    id: string;
    email: string;
    username: string;
    name: string;
    image?: string;
  };
  lastValidated: number;
}
