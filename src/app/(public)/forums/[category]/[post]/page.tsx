import Link from "next/link";
import { format } from "date-fns";
import { ArrowLeft, Eye, Lock, MessageCircle, Pin } from "lucide-react";
import { getCurrentUser } from "@/lib/rbac";
import { getPublicForumThread, type ForumReader } from "@/lib/services/forum";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CommentForm } from "../../_components/comment-form";
import { ReportButton } from "../../_components/report-button";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

/**
 * Thread detail view (UI-27): the PUBLISHED post, its PUBLISHED comments,
 * the comment form, and report controls. Any gate failure (unknown slug,
 * invisible category, non-PUBLISHED post) resolves to null and renders the
 * "not available" block — moderation states are never readable here.
 */

function AuthorLine({ name }: { name: string | null | undefined }) {
  return (
    <div className="flex items-center gap-2">
      <Avatar className="h-8 w-8">
        <AvatarFallback className="text-xs">
          {(name ?? "M").slice(0, 1).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <span className="text-sm font-medium">{name ?? "Former member"}</span>
    </div>
  );
}

export default async function ForumThreadPage({
  params,
}: {
  params: Promise<{ category: string; post: string }>;
}) {
  const { category: categorySlug, post: postId } = await params;

  const currentUser = await getCurrentUser();
  const reader: ForumReader = currentUser ? { role: currentUser.role } : null;

  const detail = await getPublicForumThread(categorySlug, postId, reader);
  if (!detail) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Thread not available</h1>
          <p className="text-muted-foreground mb-6">
            This thread doesn&apos;t exist, hasn&apos;t been published, or isn&apos;t open to your
            account.
          </p>
          <Link
            href={`/forums/${categorySlug}`}
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Back to threads
          </Link>
        </div>
      </div>
    );
  }

  const { category, post, comments } = detail;
  const threadPath = `/forums/${category.name}/${post.id}`;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link
            href={`/forums/${category.name}`}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {category.displayName}
          </Link>
        </div>

        {/* Thread header */}
        <div className="mb-6">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-3xl font-bold">{post.title}</h1>
            <div className="flex shrink-0 items-center gap-1.5 pt-1">
              {post.isSticky && (
                <Badge variant="secondary" className="gap-1">
                  <Pin className="h-3 w-3" />
                  Pinned
                </Badge>
              )}
              {post.isLocked && (
                <Badge variant="outline" className="gap-1">
                  <Lock className="h-3 w-3" />
                  Locked
                </Badge>
              )}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <AuthorLine name={post.author?.name} />
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>Posted {format(post.createdAt, "MMM d, yyyy")}</span>
              <span className="inline-flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" />
                {post.views} view{post.views === 1 ? "" : "s"}
              </span>
            </div>
          </div>
          {post.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {post.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Post body */}
        <Card className="mb-8">
          <CardContent>
            <p className="whitespace-pre-wrap text-foreground leading-relaxed">{post.content}</p>
          </CardContent>
        </Card>

        <div className="mb-8">
          <ReportButton
            targetType="POST"
            targetId={post.id}
            targetLabel="thread"
            threadPath={threadPath}
          />
        </div>

        <Separator className="mb-8" />

        {/* Comments */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-muted-foreground" />
            Comments ({comments.length})
          </h2>
        </div>

        {comments.length === 0 ? (
          <div className="text-center py-10 border rounded-lg bg-card mb-8">
            <p className="text-muted-foreground">No comments yet.</p>
          </div>
        ) : (
          <div className="space-y-4 mb-8">
            {comments.map((comment) => (
              <Card key={comment.id}>
                <CardContent className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <AuthorLine name={comment.author?.name} />
                      <span className="text-xs text-muted-foreground">
                        {format(comment.createdAt, "MMM d, yyyy")}
                      </span>
                    </div>
                    <ReportButton
                      targetType="COMMENT"
                      targetId={comment.id}
                      targetLabel="comment"
                      threadPath={threadPath}
                    />
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{comment.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Comment form (handles locked + session gating itself) */}
        <CommentForm postId={post.id} threadPath={threadPath} isLocked={post.isLocked} />
      </div>
    </div>
  );
}
