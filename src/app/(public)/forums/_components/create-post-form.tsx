"use client";

/**
 * New-thread form for the public forums (UI-27).
 *
 * Posting always requires an account (D8). The form mirrors the jobs
 * apply-form pattern: session-gated card, inline problem+json error
 * parsing, and honest success copy. Forum API success bodies are
 * double-wrapped to `{}` by the route handlers, so we rely on the status
 * code and `router.refresh()` instead of reading the response payload.
 *
 * Members without forum:create (e.g. the base `user` role) get a clear
 * explanation instead of a form that can only fail — the same client-safe
 * permission map the API enforces.
 */

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Info, LogIn, MessageSquarePlus } from "lucide-react";
import { roleHasPermission } from "@/types/role";
import { useSession } from "@/lib/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

const THREAD_TYPES = [
  { value: "DISCUSSION", label: "Discussion" },
  { value: "QUESTION", label: "Question" },
  { value: "RESOURCE", label: "Resource" },
] as const;

interface CreatePostFormProps {
  categoryId: string;
  /** Category slug, used to build the post-login redirect target. */
  categorySlug: string;
}

export function CreatePostForm({ categoryId, categorySlug }: CreatePostFormProps) {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<string>("DISCUSSION");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (isPending) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Start a new thread</CardTitle>
          <CardDescription>Checking your session...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!session?.user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Start a new thread</CardTitle>
          <CardDescription>
            Posting in the forums requires an account. Sign in to start a discussion.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full sm:w-auto">
            <Link href={`/auth/login?redirectTo=${encodeURIComponent(`/forums/${categorySlug}`)}`}>
              <LogIn className="mr-2 h-4 w-4" />
              Sign in to post
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const role = (session.user as { role?: string }).role ?? "user";

  if (!roleHasPermission(role, "forum:create")) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Start a new thread</CardTitle>
          <CardDescription>
            Your account can read the forums but does not currently have permission to start new
            threads. Contact the community team if you believe this is a mistake.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Thread submitted
          </CardTitle>
          <CardDescription>{success}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/forums/posts", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          categoryId,
          title: title.trim(),
          content: content.trim(),
          type,
        }),
      });

      if (!res.ok) {
        const problem = (await res.json().catch(() => null)) as {
          detail?: string;
          title?: string;
        } | null;
        setError(problem?.detail ?? problem?.title ?? "Failed to create your thread.");
        return;
      }

      // Honest messaging: non-moderating members go through the moderation
      // queue (their posts land as PENDING_REVIEW), roles with
      // forum:moderate publish immediately. This mirrors the service logic.
      setSuccess(
        roleHasPermission(role, "forum:moderate")
          ? "Your thread has been published and is now visible in this category."
          : "Your thread is awaiting review. It will appear in this category once a moderator approves it.",
      );
      router.refresh();
    } catch {
      setError("Something went wrong while creating your thread. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquarePlus className="h-5 w-5 text-muted-foreground" />
          Start a new thread
        </CardTitle>
        <CardDescription>
          {roleHasPermission(role, "forum:moderate")
            ? "Your thread will be published immediately."
            : "New threads are reviewed by a moderator before they appear here."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="thread-title">Title</Label>
            <Input
              id="thread-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="A short, descriptive title"
              maxLength={300}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="thread-type">Type</Label>
            <select
              id="thread-type"
              value={type}
              onChange={(event) => setType(event.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {THREAD_TYPES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="thread-content">Content</Label>
            <Textarea
              id="thread-content"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="What would you like to discuss?"
              rows={6}
              maxLength={50000}
              required
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" disabled={submitting}>
            {submitting ? "Submitting..." : "Post thread"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
