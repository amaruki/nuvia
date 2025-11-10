import { createAuthClient } from "better-auth/react";
import { APP_URL } from "./config";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || APP_URL,
});

// Infer types from the auth configuration
export type Session = typeof authClient.$Infer.Session;

// Export the useSession hook for convenience
export const { useSession } = authClient;