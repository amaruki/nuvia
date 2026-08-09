/**
 * UI-23 — link-google-button: starts the real better-auth link-social flow
 * (GET /api/auth/link-social under the hood, via the typed client). Only
 * rendered by settings/oauth when the Google provider is actually
 * configured AND the user has not linked it yet — never a fake connect
 * button for an unconfigured provider.
 */

"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { oauthUtils } from "@/lib/client";
import { Button } from "@/components/ui/button";

export function LinkGoogleButton() {
  const [isLinking, setIsLinking] = useState(false);

  async function handleLink() {
    setIsLinking(true);
    try {
      await oauthUtils.linkOAuthAccount("google");
      // On success the browser is redirected to Google's consent screen,
      // then back through /auth/callback with the account linked.
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not start Google linking.";
      toast.error("Google linking failed", { description: message });
      setIsLinking(false);
    }
  }

  return (
    <Button type="button" variant="outline" onClick={handleLink} disabled={isLinking}>
      {isLinking && <Loader2 className="h-4 w-4 animate-spin" />}
      Connect Google
    </Button>
  );
}
