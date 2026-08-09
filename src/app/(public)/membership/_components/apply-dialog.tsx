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

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ApiClientError, apiFetch } from "@/lib/api-client";
import { useSession } from "@/lib/client";
import {
  membershipApplicationSchema,
  type MembershipApplicationFormInput,
  type MembershipApplicationFormValues,
} from "@/lib/validation/organization.validation";

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
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const wasOpen = useRef(false);

  const form = useForm<MembershipApplicationFormInput, unknown, MembershipApplicationFormValues>({
    resolver: zodResolver(membershipApplicationSchema),
    defaultValues: { name: "", email: "", organization: "", message: "" },
  });
  const { isSubmitting } = form.formState;

  // Prefill once per open from the session (editable — the contact details
  // on the application are what the membership team will actually use).
  useEffect(() => {
    if (open && !wasOpen.current) {
      setError(null);
      setSubmitted(false);
      form.reset({
        name: session?.user?.name ?? "",
        email: session?.user?.email ?? "",
        organization: "",
        message: "",
      });
    }
    wasOpen.current = open;
  }, [open, session, form]);

  const onValid = async (data: MembershipApplicationFormValues) => {
    setError(null);

    try {
      await apiFetch<ApplicationResponse>("/api/v1/membership-applications", {
        method: "POST",
        body: JSON.stringify({
          tierId,
          name: data.name,
          email: data.email,
          organization: data.organization || null,
          message: data.message || null,
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
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onValid)} noValidate>
              <DialogHeader>
                <DialogTitle>Apply for {tierName}</DialogTitle>
                <DialogDescription>
                  Submit an application and the membership team will confirm payment details with
                  you. No payment is taken on this website.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full name</FormLabel>
                      <FormControl>
                        <Input maxLength={200} autoComplete="name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact email</FormLabel>
                      <FormControl>
                        <Input type="email" maxLength={320} autoComplete="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="organization"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Organization <span className="text-muted-foreground">(optional)</span>
                      </FormLabel>
                      <FormControl>
                        <Input maxLength={200} autoComplete="organization" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Anything we should know?{" "}
                        <span className="text-muted-foreground">(optional)</span>
                      </FormLabel>
                      <FormControl>
                        <Textarea maxLength={2000} rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit application
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
