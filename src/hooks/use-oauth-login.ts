"use client";

import { useState, useCallback } from "react";
import { signInWithOAuthAction } from "@/lib/actions/oauth-better-auth.actions";
import type { OAuthProvider } from "@/types/auth.types";

interface OAuthError {
  code: string;
  message: string;
  provider: OAuthProvider;
}

interface UseOAuthLoginOptions {
  onSuccess?: (provider: OAuthProvider, redirectUrl: string) => void;
  onError?: (error: OAuthError) => void;
  defaultCallbackUrl?: string;
}

/**
 * Custom hook for handling OAuth authentication flows
 * Eliminates code duplication between auth pages
 */
export function useOAuthLogin(options: UseOAuthLoginOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<OAuthError | null>(null);

  const {
    onSuccess,
    onError,
    defaultCallbackUrl = "/dashboard"
  } = options;

  const signInWithOAuth = useCallback(async (
    provider: OAuthProvider,
    callbackUrl?: string
  ): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const targetCallbackUrl = callbackUrl || defaultCallbackUrl;
      const result = await signInWithOAuthAction(provider, targetCallbackUrl);

      if (result.success && result.data?.url) {
        onSuccess?.(provider, result.data.url);
        window.location.href = result.data.url;
      } else {
        const oauthError: OAuthError = {
          code: "OAUTH_FAILED",
          message: result.message || `Failed to initialize ${provider} authentication`,
          provider,
        };
        setError(oauthError);
        onError?.(oauthError);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      const oauthError: OAuthError = {
        code: "OAUTH_ERROR",
        message: `An unexpected error occurred with ${provider}. Please try again.`,
        provider,
      };

      console.error(`OAuth error for ${provider}:`, err);
      setError(oauthError);
      onError?.(oauthError);
    } finally {
      setIsLoading(false);
    }
  }, [onSuccess, onError, defaultCallbackUrl]);

  const signInWithGoogle = useCallback(() =>
    signInWithOAuth("google"), [signInWithOAuth]);

  const signInWithGitHub = useCallback(() =>
    signInWithOAuth("github"), [signInWithOAuth]);

  const signInWithLinkedIn = useCallback(() =>
    signInWithOAuth("linkedin"), [signInWithOAuth]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    signInWithOAuth,
    signInWithGoogle,
    signInWithGitHub,
    signInWithLinkedIn,
    isLoading,
    error,
    clearError,
  };
}