import type { SafeUser } from "@/types/auth.types";

/**
 * Shape of the user row these actions receive — better-auth base fields plus
 * the additionalFields declared in src/lib/auth/permissions.ts. Optional
 * members cover both the raw better-auth responses and already-safe
 * SafeUser values (getCurrentUserAction feeds one back through this map).
 */
export interface AuthUserSource {
  id: string;
  username?: string | null;
  name?: string | null;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  bio?: string | null;
  externalLinks?: unknown;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Transform better-auth user to SafeUser
 */
export function transformUserToSafeUser(user: AuthUserSource): SafeUser {
  return {
    id: user.id,
    username: user.username || user.name || "",
    email: user.email,
    emailVerified: user.emailVerified,
    displayName: user.name,
    profilePhoto: user.image,
    bio: user.bio,
    externalLinks: user.externalLinks,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    deletedAt: undefined,
  };
}
