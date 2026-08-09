"use client";

import { useState } from "react";
import { CheckCircle2, Copy, QrCode } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatDate, formatTime } from "@/lib/utils/event-utils";

interface SelfCheckInCardProps {
  eventId: string;
  qrCode: string;
  phase: "upcoming" | "open" | "ended";
  opensAt: Date;
  closesAt: Date;
}

/**
 * Owner-facing self check-in card (UI-24 item 5). Shows the member's own QR
 * credential and posts it to the self-check-in API. The server re-validates
 * ownership, credential, and window on every submit — the button state here
 * is only a courtesy.
 */
export function SelfCheckInCard({
  eventId,
  qrCode,
  phase,
  opensAt,
  closesAt,
}: SelfCheckInCardProps) {
  const [submitting, setSubmitting] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const windowCopy =
    phase === "upcoming"
      ? `Check-in opens ${formatDate(opensAt)} at ${formatTime(opensAt)}.`
      : phase === "open"
        ? `Check-in is open and closes ${formatDate(closesAt)} at ${formatTime(closesAt)}.`
        : `Check-in closed ${formatDate(closesAt)} at ${formatTime(closesAt)}.`;

  async function handleCheckIn() {
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/v1/events/${eventId}/self-check-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrCode }),
      });
      if (!response.ok) {
        const payload: { detail?: string; title?: string } | null = await response
          .json()
          .catch(() => null);
        throw new Error(payload?.detail ?? payload?.title ?? "Check-in failed. Please try again.");
      }
      setCheckedIn(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Check-in failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(qrCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be denied (permissions/iframe); the code is
      // still visible on screen, so failing silently is acceptable.
    }
  }

  if (checkedIn) {
    return (
      <div
        className="rounded-lg border border-success/30 bg-success/10 p-6 text-center"
        role="status"
      >
        <CheckCircle2 className="mx-auto h-10 w-10 text-success" />
        <p className="mt-3 font-medium">You&apos;re checked in!</p>
        <p className="text-muted-foreground mt-1 text-sm">Enjoy the event.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm" role="status">
        {windowCopy}
      </p>

      {/* The credential belongs to the session user, so it is safe to render here. */}
      <div className="rounded-lg border p-4">
        <div className="text-muted-foreground flex items-center gap-2 text-xs font-medium uppercase tracking-wide">
          <QrCode className="h-4 w-4" />
          Your check-in code
        </div>
        <p className="mt-2 font-mono text-sm break-all">{qrCode}</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={handleCopy}>
          <Copy className="h-4 w-4 mr-2" />
          {copied ? "Copied" : "Copy code"}
        </Button>
      </div>

      <Button className="w-full" onClick={handleCheckIn} disabled={phase !== "open" || submitting}>
        {submitting ? "Checking in…" : "Check In Now"}
      </Button>

      {phase !== "open" && (
        <p className="text-muted-foreground text-xs text-center">
          The check-in button unlocks during the check-in window above.
        </p>
      )}

      {error && (
        <p className="text-destructive text-sm text-center" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
