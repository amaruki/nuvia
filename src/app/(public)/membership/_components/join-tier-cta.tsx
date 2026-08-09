"use client";

/**
 * Per-tier join CTA for the public membership funnel (UI-33).
 *
 * Track behavior:
 *  - stripe  — POST /api/v1/membership/join, then redirect the member to the
 *    hosted checkout URL from the response. The funnel stays "pending" until
 *    the verified webhook confirms the charge; the copy says exactly that.
 *  - manual  — no online payment is configured, so the CTA opens the
 *    application dialog instead of pretending to take money.
 *
 * Unauthenticated visitors are routed to sign-in and returned here.
 */

import { useState } from "react";
import Link from "next/link";
import { Loader2, LogIn } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiClientError, apiFetch } from "@/lib/api-client";
import { useSession } from "@/lib/client";
import { useMounted } from "@/lib/hooks/use-mounted";
import type { JoinTrack } from "@/lib/services/membership-join.service";
import { ApplyDialog } from "./apply-dialog";

interface JoinTierCtaProps {
  tierId: string;
  tierName: string;
  track: JoinTrack;
}

interface JoinResponse {
  track: JoinTrack;
  paymentStatus: string;
  checkoutUrl: string | null;
  guidance?: string[];
}

export function JoinTierCta({ tierId, tierName, track }: JoinTierCtaProps) {
  const { data: session, isPending } = useSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applyOpen, setApplyOpen] = useState(false);
  const mounted = useMounted();

  if (!mounted || isPending) {
    return <Skeleton className="h-10 w-full" />;
  }

  if (!session?.user) {
    return (
      <Button asChild className="w-full">
        <Link href={`/auth/login?redirectTo=${encodeURIComponent("/membership")}`}>
          <LogIn className="mr-2 h-4 w-4" />
          Sign in to join
        </Link>
      </Button>
    );
  }

  const handleJoin = async () => {
    setBusy(true);
    setError(null);
    try {
      const { data } = await apiFetch<JoinResponse>("/api/v1/membership/join", {
        method: "POST",
        body: JSON.stringify({ tierId }),
      });
      if (data.checkoutUrl) {
        window.location.assign(data.checkoutUrl);
        return;
      }
      setError("No checkout was produced. Please try again or contact the membership team.");
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : "Could not start checkout. Please try again.",
      );
      setBusy(false);
    }
  };

  if (track === "manual") {
    return (
      <>
        <Button className="w-full" variant="outline" onClick={() => setApplyOpen(true)}>
          Apply for this tier
        </Button>
        <p className="mt-2 text-xs text-muted-foreground">
          Online payment is not set up yet — apply and pay offline.
        </p>
        <ApplyDialog
          open={applyOpen}
          onOpenChange={setApplyOpen}
          tierId={tierId}
          tierName={tierName}
        />
      </>
    );
  }

  return (
    <div className="space-y-2">
      <Button className="w-full" onClick={handleJoin} disabled={busy}>
        {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Join now
      </Button>
      <p className="text-xs text-muted-foreground">
        You will be redirected to complete payment. Membership activates once your payment is
        confirmed.
      </p>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
