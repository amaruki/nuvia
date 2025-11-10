"use client";

import { Button } from "@/components/ui/button";
import { GoogleIcon } from "@/components/ui/icons/google-icon";
import type { OAuthProvider } from "@/types/auth.types";

interface OAuthButtonProps {
  provider: OAuthProvider;
  isLoading: boolean;
  onClick: () => void;
  disabled?: boolean;
}

/**
 * OAuth provider button component
 * Provides consistent styling and behavior across auth pages
 */
export function OAuthButton({ provider, isLoading, onClick, disabled }: OAuthButtonProps) {
  const getProviderIcon = () => {
    switch (provider) {
      case "google":
        return <GoogleIcon size={20} className="w-5 h-5" />;
      // Add other providers as needed
      default:
        return null;
    }
  };

  const getProviderName = () => {
    switch (provider) {
      case "google":
        return "Google";
      case "github":
        return "GitHub";
      case "linkedin":
        return "LinkedIn";
      default:
        return provider.charAt(0).toUpperCase() + provider.slice(1);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      disabled={disabled || isLoading}
      className="w-full h-10 justify-center gap-3"
    >
      {getProviderIcon()}
      <span>{isLoading ? "Connecting..." : getProviderName()}</span>
    </Button>
  );
}