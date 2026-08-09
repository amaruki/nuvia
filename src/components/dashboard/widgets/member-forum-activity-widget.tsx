/**
 * UI-31 — My forum activity widget (member home).
 *
 * Shows the caller's own forum posts and comments. PUBLISHED items link to
 * their public thread under `(public)/forums`; the caller's own
 * PENDING_REVIEW posts and PENDING comments surface too, labelled "awaiting
 * review" rather than being hidden. Drafts and hidden content never appear.
 *
 * Server component.
 */

import Link from "next/link";
import { MessageSquare, MessagesSquare } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type { MyForumCommentItem, MyForumPostItem } from "@/lib/services/member/home";
import { isForumItemAwaitingReview } from "./member-home-states";
import { formatDate } from "@/lib/utils/date-utils";

interface MemberForumActivityWidgetProps {
  posts: MyForumPostItem[];
  comments: MyForumCommentItem[];
}

export function MemberForumActivityWidget({ posts, comments }: MemberForumActivityWidgetProps) {
  const isEmpty = posts.length === 0 && comments.length === 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessagesSquare className="h-5 w-5 text-muted-foreground" aria-hidden />
          My forum activity
        </CardTitle>
        <CardDescription>Threads you started and comments you left</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {isEmpty ? (
          <EmptyState
            title="No forum activity yet"
            description="Posts and comments you write will appear here."
            icon={<MessagesSquare className="h-8 w-8 text-muted-foreground" />}
          />
        ) : (
          <>
            <section className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Posts</h3>
              {posts.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  You haven&apos;t started any threads yet.
                </p>
              ) : (
                <ul className="space-y-2">
                  {posts.map((post) => {
                    const awaitingReview = isForumItemAwaitingReview(post.status);
                    const body = (
                      <span className="font-medium underline-offset-4 group-hover:underline">
                        {post.title}
                      </span>
                    );
                    return (
                      <li key={post.id} className="flex flex-col gap-1">
                        {post.categorySlug ? (
                          <Link href={`/forums/${post.categorySlug}/${post.id}`} className="group">
                            {body}
                          </Link>
                        ) : (
                          <span className="font-medium">{post.title}</span>
                        )}
                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                          {awaitingReview ? (
                            <Badge variant="secondary">Awaiting review</Badge>
                          ) : (
                            <span>
                              {post.replyCount} {post.replyCount === 1 ? "reply" : "replies"}
                            </span>
                          )}
                          <span>·</span>
                          <span>{formatDate(post.createdAt, "MMM d, yyyy")}</span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Comments</h3>
              {comments.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  You haven&apos;t left any comments yet.
                </p>
              ) : (
                <ul className="space-y-2">
                  {comments.map((comment) => {
                    const awaitingReview = isForumItemAwaitingReview(comment.status);
                    const linkable =
                      comment.categorySlug !== null && comment.postStatus === "PUBLISHED";
                    const content = <span className="line-clamp-2 text-sm">{comment.content}</span>;
                    return (
                      <li key={comment.id} className="flex flex-col gap-1">
                        {linkable ? (
                          <Link
                            href={`/forums/${comment.categorySlug}/${comment.postId}`}
                            className="group space-y-1"
                          >
                            {content}
                            <span className="flex items-center gap-1 text-xs text-muted-foreground group-hover:underline">
                              <MessageSquare className="h-3 w-3" aria-hidden />
                              on “{comment.postTitle}”
                            </span>
                          </Link>
                        ) : (
                          <>
                            {content}
                            <span className="text-xs text-muted-foreground">
                              on “{comment.postTitle}”
                            </span>
                          </>
                        )}
                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                          {awaitingReview ? (
                            <Badge variant="secondary">Awaiting review</Badge>
                          ) : null}
                          <span>{formatDate(comment.createdAt, "MMM d, yyyy")}</span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </>
        )}
      </CardContent>
    </Card>
  );
}
