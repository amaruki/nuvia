"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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

// Client-side session cache to avoid re-rendering delays
interface CachedSessionState {
  user: User | null;
  lastValidated: number;
  isValid: boolean;
}

const SESSION_CACHE_TTL = 30 * 1000; // 30 seconds client-side cache
let globalSessionCache: CachedSessionState | null = null;

export function useSession(): SessionData {
  const { data: authUser, isPending, error } = authClient.useSession();

  // Local state with caching
  const [userData, setUserData] = useState<User | null>(() => {
    // Initialize from global cache on first render
    if (globalSessionCache &&
        Date.now() - globalSessionCache.lastValidated < SESSION_CACHE_TTL &&
        globalSessionCache.isValid) {
      return globalSessionCache.user;
    }
    return null;
  });
  const [sessionError, setSessionError] = useState<string | null>(null);

  // Optimized user data transformation with memoization
  const transformUserData = useCallback((authUser: any): User => {
    return {
      id: authUser.user.id,
      username: (authUser.user as any).username || authUser.user.name || "",
      email: authUser.user.email,
      displayName: authUser.user.name || (authUser.user as any).displayName || undefined,
      image: authUser.user.image || undefined,
      bio: (authUser.user as any).bio || undefined,
      role: (authUser.user as any).role || "USER",
      createdAt: new Date(authUser.user.createdAt),
      updatedAt: new Date(authUser.user.updatedAt),
    };
  }, []);

  // Update global cache and local state
  useEffect(() => {
    if (authUser) {
      const transformedUser = transformUserData(authUser);

      // Update global cache
      globalSessionCache = {
        user: transformedUser,
        lastValidated: Date.now(),
        isValid: true,
      };

      // Cache session data on server-side via API call (only if Redis is enabled)
      // Note: This is async but we don't await it to avoid blocking the UI
      if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_ENABLE_REDIS_CACHE === 'true') {
        fetch('/api/auth/cache-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: authUser.session?.token || '',
            sessionData: {
              id: authUser.user.id,
              userId: authUser.user.id,
              expiresAt: new Date(authUser.session?.expiresAt || Date.now() + 7 * 24 * 60 * 60 * 1000),
              user: transformedUser,
            },
          }),
        }).catch(error => {
          console.warn('Failed to cache session:', error);
        });
      }

      // Update local state
      setUserData(transformedUser);
      setSessionError(null);
    } else if (!isPending && !authUser) {
      // Clear cache and state when user is logged out
      globalSessionCache = {
        user: null,
        lastValidated: Date.now(),
        isValid: false,
      };
      setUserData(null);
      setSessionError(null);
    }
  }, [authUser, isPending, transformUserData]);

  // Handle errors
  useEffect(() => {
    if (error) {
      setSessionError(error.message || "Session error");
      // Invalidate cache on error
      globalSessionCache = null;
    }
  }, [error]);

  // Memoize return value to prevent unnecessary re-renders
  return useMemo(() => ({
    user: userData,
    isPending,
    error: sessionError,
  }), [userData, isPending, sessionError]);
}

/**
 * Utility function to manually invalidate session cache
 * Useful after logout or session changes
 */
export function invalidateSessionCache(sessionToken?: string): void {
  // Clear client-side cache
  globalSessionCache = null;

  // Clear server-side cache if token is provided (only if Redis is enabled)
  if (sessionToken && typeof window !== 'undefined' && process.env.NEXT_PUBLIC_ENABLE_REDIS_CACHE === 'true') {
    fetch('/api/auth/invalidate-session-cache', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: sessionToken }),
    }).catch(error => {
      console.warn('Failed to invalidate server session cache:', error);
    });
  }
}

/**
 * Utility function to check if session is cached and valid
 */
export function isSessionCached(): boolean {
  return globalSessionCache !== null &&
         Date.now() - globalSessionCache.lastValidated < SESSION_CACHE_TTL &&
         globalSessionCache.isValid;
}