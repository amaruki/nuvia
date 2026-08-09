"use client";

/**
 * Review dialog for a membership application (UI-33).
 *
 * Approve/Reject POST a PATCH to /api/v1/membership-applications/[id] and
 * surface conflicts (already reviewed) verbatim. Approval records the
 * decision only — the membership activates once the offline payment is
 * booked; the copy never claims otherwise.
 */

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ApiClientError, apiFetch } from "@/lib/api-client";

interface ReviewApplication {
  id: string;
  name: string;
  email: string;
  organization: string | null;
  tierName: string | null;
  message: string | null;
}

interface ReviewDialogProps {
  application: ReviewApplication | null;
  onClose: () => void;
  onReviewed: () => void;
  onError: (message: string) => void;
}

interface ReviewResponse {
  id: string;
  status: string;
}

export function ReviewDialog({ application, onClose, onReviewed, onError }: ReviewDialogProps) {
  const [reviewNote, setReviewNote] = useState("");
  const [decision, setDecision] = useState<"APPROVED" | "REJECTED" | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset transient state each time a new application is opened.
  useEffect(() => {
    setReviewNote("");
    setDecision(null);
    setError(null);
  }, [application?.id]);

  const submit = async (next: "APPROVED" | "REJECTED") => {
    if (!application) return;
    setSubmitting(true);
    setError(null);
    setDecision(next);
    try {
      await apiFetch<ReviewResponse>(
        `/api/v1/membership-applications/${encodeURIComponent(application.id)}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            decision: next,
            reviewNote: reviewNote.trim() || null,
          }),
        },
      );
      onReviewed();
    } catch (err) {
      const message =
        err instanceof ApiClientError ? err.message : "Failed to record the review decision.";
      setError(message);
      onError(message);
      setDecision(null);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={application !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        {application && (
          <>
            <DialogHeader>
              <DialogTitle>Review application</DialogTitle>
              <DialogDescription>
                {application.name} · {application.email}
                {application.organization ? ` · ${application.organization}` : ""}
                {application.tierName ? ` — ${application.tierName}` : ""}
              </DialogDescription>
            </DialogHeader>

            {application.message && (
              <div className="rounded-md border bg-muted/40 p-3 text-sm whitespace-pre-wrap">
                {application.message}
              </div>
            )}

            <div className="grid gap-2 py-2">
              <Label htmlFor="review-note">Review note (optional)</Label>
              <Textarea
                id="review-note"
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                maxLength={2000}
                rows={3}
                placeholder="Visible to other reviewers; included in the audit log."
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={onClose} disabled={submitting}>
                Close
              </Button>
              <Button
                variant="destructive"
                onClick={() => void submit("REJECTED")}
                disabled={submitting}
              >
                {submitting && decision === "REJECTED" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="mr-2 h-4 w-4" />
                )}
                Reject
              </Button>
              <Button onClick={() => void submit("APPROVED")} disabled={submitting}>
                {submitting && decision === "APPROVED" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                )}
                Approve
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
