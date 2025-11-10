import { createAuthClient } from "better-auth/react";
import type { auth } from "./auth";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
});

// Infer types from the auth configuration
export type Session = typeof authClient.$Infer.Session;
export type User = typeof authClient.$Infer.User;
export type AuthError = typeof authClient.$Infer.Error;

// Export the useSession hook for convenience
export const { useSession } = authClient;