"use client";

/**
 * Public-profile visibility toggle (UI-28, decision D7).
 *
 * Default off and honest about what turns on: the copy names exactly which
 * fields become visible and which never do. Optimistic flip with rollback on
 * failure; persistence flows through the existing profile update path
 * (`auth.api.updateUser`).
 */

import { useEffect, useState, useTransition } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";

import {
  getProfileVisibilityAction,
  setProfileVisibilityAction,
} from "./public-profile-visibility.actions";

export function PublicProfileVisibility() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;

    getProfileVisibilityAction().then((result) => {
      if (cancelled) return;
      if (result.success) {
        setEnabled(result.profilePublic ?? false);
      } else {
        // Load failed: keep the switch off and locked rather than guessing.
        setEnabled(false);
        setError(result.error ?? "Failed to load the visibility setting");
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleToggle = (next: boolean) => {
    const previous = enabled;
    setEnabled(next);
    setError(null);

    startTransition(async () => {
      const result = await setProfileVisibilityAction(next);
      if (!result.success) {
        setEnabled(previous);
        setError(result.error ?? "Failed to update the visibility setting");
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <Label htmlFor="profile-public" className="text-base font-medium">
            Show my profile in the public member directory
          </Label>
          <p className="text-sm text-muted-foreground">
            Your name, photo, bio, links, and chapter or committee affiliations become visible to
            anyone at <span className="font-medium">/members</span>. Your email address, account
            role, and other account details are never shown. You can turn this off at any time.
          </p>
          <p className="text-sm text-muted-foreground">
            Accounts are private by default — nothing is shared until you switch this on.
          </p>
        </div>

        {enabled === null ? (
          <Skeleton className="mt-1 h-6 w-11" aria-hidden="true" />
        ) : (
          <Switch
            id="profile-public"
            checked={enabled}
            disabled={isPending || error !== null}
            onCheckedChange={handleToggle}
          />
        )}
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
