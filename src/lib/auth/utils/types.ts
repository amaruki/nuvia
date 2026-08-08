/**
 * Shared types for the consolidated authentication utilities.
 */

import { SafeUser } from "@/types/auth.types";

// Better Auth Session type - matches the actual response from auth.api.getSession()
export interface Session {
  user: SafeUser;
  session: {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    expiresAt: Date;
    token: string;
    ipAddress?: string | null;
    userAgent?: string | null;
  };
}

// Type for JSON fields in Better Auth
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export interface ProfileUpdateData {
  name?: string;
  image?: string | null;
  displayName?: string | null;
  bio?: string | null;
  username?: string;
  externalLinks?: JsonValue | null;
  profilePhoto?: string | null;
}

export interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
}

/**
 * Result type for authentication operations
 */
export interface AuthResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
