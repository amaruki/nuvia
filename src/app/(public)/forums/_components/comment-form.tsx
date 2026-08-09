"use client";

/**
 * Comment form for the public forum thread view (UI-27).
 *
 * Same session-gate pattern as the create-post form, validated with RHF +
 * zod through forumCommentSchema (UI-16 form standard). Comments are stored
 * PUBLISHED immediately by the service, so a `router.refresh()` after a
 * successful POST shows the new comment right away. The response body is
 * `{}` (double-wrapped by the route handler), so only the status code is
 * consulted.
 */

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LogIn, Lock, MessageCircle } from "lucide-react";
import { roleHasPermission } from "@/types/role";
import { useSession } from "@/lib/client";
import { useMounted } from "@/lib/hooks/use-mounted";
import { forumCommentSchema, type ForumCommentFormValues } from "@/lib/validation/forum.validation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

interface CommentFormProps {
  postId: string;
  /** Thread path, used to build the post-login redirect target. */
  threadPath: string;
  isLocked: boolean;
}

export function CommentForm({ postId, threadPath, isLocked }: CommentFormProps) {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [posted, setPosted] = useState(false);
  const mounted = useMounted();

  const form = useForm<ForumCommentFormValues>({
    resolver: zodResolver(forumCommentSchema),
    defaultValues: { content: "" },
  });
  const { isSubmitting } = form.formState;

  if (isLocked) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-muted-foreground" />
            Thread locked
          </CardTitle>
          <CardDescription>
            This thread has been locked by a moderator. New comments are no longer accepted.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!mounted || isPending) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Leave a comment</CardTitle>
          <CardDescription>Checking your session...</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!session?.user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Leave a comment</CardTitle>
          <CardDescription>Join the conversation — posting requires an account.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full sm:w-auto">
            <Link href={`/auth/login?redirectTo=${encodeURIComponent(threadPath)}`}>
              <LogIn className="mr-2 h-4 w-4" />
              Sign in to comment
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
          <CardTitle>Leave a comment</CardTitle>
          <CardDescription>
            Your account can read this thread but does not currently have permission to comment.
            Contact the community team if you believe this is a mistake.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const onValid = async (data: ForumCommentFormValues) => {
    setError(null);

    try {
      const res = await fetch(`/api/v1/forums/posts/${postId}/comments`, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ postId, content: data.content }),
      });

      if (!res.ok) {
        const problem = (await res.json().catch(() => null)) as {
          detail?: string;
          title?: string;
        } | null;
        setError(problem?.detail ?? problem?.title ?? "Failed to post your comment.");
        return;
      }

      form.reset();
      setPosted(true);
      router.refresh();
    } catch {
      setError("Something went wrong while posting your comment. Please try again.");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-muted-foreground" />
          Leave a comment
        </CardTitle>
        <CardDescription>
          Be constructive. Comments appear immediately after posting.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onValid)} className="space-y-4">
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder="Share your thoughts..."
                      rows={4}
                      maxLength={20000}
                      aria-label="Comment"
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

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Posting..." : "Post comment"}
              </Button>
              {posted && !error && <span className="text-sm text-green-600">Comment posted.</span>}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
