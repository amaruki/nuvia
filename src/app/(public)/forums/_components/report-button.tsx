"use client";

/**
 * Report content control for the public forums (UI-27).
 *
 * Wires the existing POST /api/v1/forums/reports endpoint, validated with
 * RHF + zod through forumReportSchema (UI-16 form standard); reason is
 * required server-side. Rendering is session-gated; permission failures
 * (the endpoint requires forum:create) surface the API's own message.
 */

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Flag } from "lucide-react";
import { useSession } from "@/lib/client";
import { useMounted } from "@/lib/hooks/use-mounted";
import { forumReportSchema, type ForumReportFormValues } from "@/lib/validation/forum.validation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";

interface ReportButtonProps {
  targetType: "POST" | "COMMENT";
  targetId: string;
  /** Short label of what is being reported, for honest copy. */
  targetLabel: string;
  /** Post-login redirect target. */
  threadPath: string;
}

export function ReportButton({ targetType, targetId, targetLabel, threadPath }: ReportButtonProps) {
  const { data: session, isPending } = useSession();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reported, setReported] = useState(false);
  const mounted = useMounted();

  const form = useForm<ForumReportFormValues>({
    resolver: zodResolver(forumReportSchema),
    defaultValues: {
      targetType,
      postId: targetType === "POST" ? targetId : undefined,
      commentId: targetType === "COMMENT" ? targetId : undefined,
      reason: "",
    },
  });
  const { isSubmitting } = form.formState;

  if (reported) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <CheckCircle2 className="h-4 w-4 text-success" />
        Report submitted. Thank you. A moderator will review it.
      </div>
    );
  }

  if (!mounted || isPending) return null;

  if (!session?.user) {
    return (
      <Button variant="ghost" size="sm" asChild className="text-muted-foreground">
        <Link href={`/auth/login?redirectTo=${encodeURIComponent(threadPath)}`}>
          <Flag className="mr-2 h-3.5 w-3.5" />
          Sign in to report
        </Link>
      </Button>
    );
  }

  const onValid = async (data: ForumReportFormValues) => {
    setError(null);

    try {
      const res = await fetch("/api/v1/forums/reports", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(
          data.targetType === "POST"
            ? { targetType: data.targetType, postId: data.postId, reason: data.reason }
            : { targetType: data.targetType, commentId: data.commentId, reason: data.reason },
        ),
      });

      if (!res.ok) {
        const problem = (await res.json().catch(() => null)) as {
          detail?: string;
          title?: string;
        } | null;
        setError(problem?.detail ?? problem?.title ?? "Failed to submit your report.");
        return;
      }

      setReported(true);
      setOpen(false);
    } catch {
      setError("Something went wrong while submitting your report. Please try again.");
    }
  };

  if (!open) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="text-muted-foreground"
      >
        <Flag className="mr-2 h-3.5 w-3.5" />
        Report
      </Button>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onValid)} className="space-y-3 rounded-lg border p-4">
        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Report this {targetLabel}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tell the moderators what is wrong with this content (required)"
                  rows={3}
                  maxLength={1000}
                  {...field}
                />
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

        <div className="flex items-center gap-2">
          <Button type="submit" size="sm" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit report"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setOpen(false);
              setError(null);
              form.clearErrors();
            }}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
