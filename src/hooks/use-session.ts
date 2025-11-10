"use client";

import { useState, useEffect } from "react";
import { useSession as useBetterAuthSession } from "@/lib/auth-client";

interface User {
  id: string;
  username: string;
  email: string;
  displayName?: string;
  image?: string;
  bio?: string;
  role?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface SessionData {
  user: User | null;
  isPending: boolean;
  error: string | null;
}

export function useSession(): SessionData {
  const { data: session, isPending, error } = useBetterAuthSession();
  
  // Transform better-auth session to our User format
  const [userData, setUserData] = useState<User | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user) {
      setUserData({
        id: session.user.id,
        username: (session.user as any).username || session.user.name || "",
        email: session.user.email,
        displayName: session.user.name,
        image: session.user.image || undefined, // Convert null to undefined
        bio: (session.user as any).bio || undefined, // Cast to any for custom fields
        role: (session.user as any).role || "USER", // Cast to any for custom fields
        createdAt: new Date(session.user.createdAt),
        updatedAt: new Date(session.user.updatedAt),
      });
      setSessionError(null);
    } else if (!isPending && !session) {
      setUserData(null);
      setSessionError(null);
    }
  }, [session, isPending]);

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