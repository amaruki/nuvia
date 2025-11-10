"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/lib/client";

interface User {
  id: string;
  username: string;
  email: string;
  displayName?: string | null;
  image?: string | null;
  bio?: string | null;
  role?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface SessionData {
  user: User | null;
  isPending: boolean;
  error: string | null;
}

export function useSession(): SessionData {
  const { data: authUser, isPending, error } = authClient.useSession();

  // Transform better-auth user to our User format
  const [userData, setUserData] = useState<User | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);

  useEffect(() => {
    if (authUser) {
      setUserData({
        id: authUser.user.id,
        username: (authUser.user as any).username || authUser.user.name || "",
        email: authUser.user.email,
        displayName: authUser.user.name || (authUser.user as any).displayName || undefined,
        image: authUser.user.image || undefined, // Convert null to undefined
        bio: (authUser.user as any).bio || undefined, // Cast to any for custom fields
        role: (authUser.user as any).role || "USER", // Cast to any for custom fields
        createdAt: new Date(authUser.user.createdAt),
        updatedAt: new Date(authUser.user.updatedAt),
      });
      setSessionError(null);
    } else if (!isPending && !authUser) {
      setUserData(null);
      setSessionError(null);
    }
  }, [authUser, isPending]);

  useEffect(() => {
    if (error) {
      setSessionError(error.message || "Session error");
    }
  }, [error]);

  return {
    user: userData,
    isPending,
    error: sessionError,
  };
}