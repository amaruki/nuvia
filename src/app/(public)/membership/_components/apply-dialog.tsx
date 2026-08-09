"use client";

/**
 * Membership application dialog (UI-33, decision D10).
 *
 * The application track is the honest fallback when online payment is not
 * configured — and it stays available as an express lane for members who
 * prefer it. Requires a signed-in account; the submission is recorded as
 * PENDING and a reviewer decides it in the dashboard queue. Copy never
 * claims payment happened or membership is active.
 */

import React, { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ApiClientError, apiFetch } from "@/lib/api-client";
import { useSession } from "@/lib/client";

interface ApplyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tierId: string;
  tierName: string;
}

interface ApplicationResponse {
  id: string;
  status: string;
}

export function ApplyDialog({ open, onOpenChange, tierId, tierName }: ApplyDialogProps) {
  const { data: session } = useSession();
  const [name, setName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [organization, setOrganization] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Prefill once per open from the session (editable — the contact details
  // on the application are what the membership team will actually use).
  const effectiveName = name ?? session?.user?.name ?? "";
  const effectiveEmail = email ?? session?.user?.email ?? "";

  const reset = () => {
    setError(null);
    setSubmitted(false);
    setOrganization("");
    setMessage("");
    setName(null);
    setEmail(null);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await apiFetch<ApplicationResponse>("/api/v1/membership-applications", {
        method: "POST",
        body: JSON.stringify({
          tierId,
          name: effectiveName.trim(),
          email: effectiveEmail.trim(),
          organization: organization.trim() || null,
          message: message.trim() || null,
        }),
      });
      setSubmitted(true);
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 409) {
        setError(
          "You already have a pending application for this tier. The membership team will review it soon.",
        );
      } else {
        setError(err instanceof Error ? err.message : "Failed to submit your application.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        {submitted ? (
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Application received
            </DialogTitle>
            <DialogDescription>
              Your application for the {tierName} tier is pending review. The membership team will
              contact you about payment and activation — nothing has been charged.
            </DialogDescription>
          </DialogHeader>
        ) : (
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Apply for {tierName}</DialogTitle>
              <DialogDescription>
                Submit an application and the membership team will confirm payment details with you.
                No payment is taken on this website.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="membership-application-name">Full name</Label>
                <Input
                  id="membership-application-name"
                  value={effectiveName}
                  onChange={(e) => setName(e.target.value)}
                  required
                  maxLength={200}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="membership-application-email">Contact email</Label>
                <Input
                  id="membership-application-email"
                  type="email"
                  value={effectiveEmail}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  maxLength={320}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="membership-application-organization">
                  Organization <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="membership-application-organization"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  maxLength={200}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="membership-application-message">
                  Anything we should know? <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Textarea
                  id="membership-application-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={2000}
                  rows={3}
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit application
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
