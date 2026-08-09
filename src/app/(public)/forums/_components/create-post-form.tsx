"use client";

/**
 * New-thread form for the public forums (UI-27).
 *
 * Posting always requires an account (D8). The form mirrors the jobs
 * apply-form pattern: session-gated card, RHF + zod validation through
 * forumPostSchema (UI-16 form standard), inline problem+json error
 * parsing, and honest success copy. Forum API success bodies are
 * double-wrapped to `{}` by the route handlers, so we rely on the status
 * code and `router.refresh()` instead of reading the response payload.
 *
 * Members without forum:create (e.g. the base `user` role) get a clear
 * explanation instead of a form that can only fail — the same client-safe
 * permission map the API enforces.
 */

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, LogIn, MessageSquarePlus } from "lucide-react";
import { roleHasPermission } from "@/types/role";
import { useSession } from "@/lib/client";
import { useMounted } from "@/lib/hooks/use-mounted";
import {
  forumPostSchema,
  FORUM_THREAD_TYPES,
  type ForumPostFormValues,
} from "@/lib/validation/forum.validation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

const THREAD_TYPE_LABELS: Record<(typeof FORUM_THREAD_TYPES)[number], string> = {
  DISCUSSION: "Discussion",
  QUESTION: "Question",
  RESOURCE: "Resource",
};

interface CreatePostFormProps {
  categoryId: string;
  /** Category slug, used to build the post-login redirect target. */
  categorySlug: string;
}

export function CreatePostForm({ categoryId, categorySlug }: CreatePostFormProps) {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const mounted = useMounted();

  const form = useForm<ForumPostFormValues>({
    resolver: zodResolver(forumPostSchema),
    defaultValues: {
      categoryId,
      title: "",
      content: "",
      type: "DISCUSSION",
    },
  });
  const { isSubmitting } = form.formState;

  if (!mounted || isPending) {
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

  const onValid = async (data: ForumPostFormValues) => {
    setError(null);

    try {
      const res = await fetch("/api/v1/forums/posts", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          categoryId: data.categoryId,
          title: data.title,
          content: data.content,
          type: data.type,
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
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onValid)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="A short, descriptive title" maxLength={300} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      const next = FORUM_THREAD_TYPES.find((option) => option === value);
                      if (next) form.setValue("type", next);
                    }}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a thread type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {FORUM_THREAD_TYPES.map((value) => (
                        <SelectItem key={value} value={value}>
                          {THREAD_TYPE_LABELS[value]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What would you like to discuss?"
                      rows={6}
                      maxLength={50000}
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

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Post thread"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
