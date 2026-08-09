import Link from "next/link";
import { format } from "date-fns";
import { ArrowLeft, Lock, Pin } from "lucide-react";
import { getCurrentUser } from "@/lib/rbac";
import {
  getPublicForumCategory,
  listPublicForumThreads,
  type ForumReader,
  type PublicForumThreadSummary,
} from "@/lib/services/forum";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { CreatePostForm } from "../_components/create-post-form";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

/**
 * Thread list for one forum category (UI-27).
 *
 * The audience gate lives in the service: an invisible or unknown category
 * resolves to null and renders an honest "not available" block instead of
 * leaking an empty list. Only PUBLISHED threads appear.
 */

const TYPE_LABELS: Record<string, string> = {
  DISCUSSION: "Discussion",
  QUESTION: "Question",
  ANNOUNCEMENT: "Announcement",
  POLL: "Poll",
  RESOURCE: "Resource",
  JOB_POSTING: "Job posting",
  EVENT_PROMOTION: "Event",
};

function parsePage(value: string | string[] | undefined): number {
  if (typeof value !== "string") return 1;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function ThreadRow({
  thread,
  categorySlug,
}: {
  thread: PublicForumThreadSummary;
  categorySlug: string;
}) {
  return (
    <Link href={`/forums/${categorySlug}/${thread.id}`} className="block group">
      <Card className="group-hover:border-primary/40 transition-colors">
        <CardContent className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-medium group-hover:text-primary transition-colors">
              {thread.title}
            </h3>
            <div className="flex shrink-0 items-center gap-1.5">
              {thread.isSticky && (
                <Badge variant="secondary" className="gap-1">
                  <Pin className="h-3 w-3" />
                  Pinned
                </Badge>
              )}
              {thread.isLocked && (
                <Badge variant="outline" className="gap-1">
                  <Lock className="h-3 w-3" />
                  Locked
                </Badge>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <Badge variant="outline">{TYPE_LABELS[thread.type] ?? thread.type}</Badge>
            <span>{thread.author?.name ?? "Former member"}</span>
            <span>·</span>
            <span>
              {thread.replyCount} repl{thread.replyCount === 1 ? "y" : "ies"}
            </span>
            <span>·</span>
            <span>
              {thread.views} view{thread.views === 1 ? "" : "s"}
            </span>
            <span>·</span>
            <span>
              {thread.lastReplyAt
                ? `Last reply ${format(thread.lastReplyAt, "MMM d, yyyy")}`
                : `Posted ${format(thread.createdAt, "MMM d, yyyy")}`}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default async function ForumCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { category: categorySlug } = await params;
  const sp = await searchParams;
  const page = parsePage(sp.page);

  const currentUser = await getCurrentUser();
  const reader: ForumReader = currentUser ? { role: currentUser.role } : null;

  const category = await getPublicForumCategory(categorySlug, reader);
  if (!category) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Forum category not available</h1>
          <p className="text-muted-foreground mb-6">
            This category doesn&apos;t exist, is not active, or isn&apos;t open to your account.
          </p>
          <Link href="/forums" className="text-blue-600 dark:text-blue-400 hover:underline">
            Back to Community Forums
          </Link>
        </div>
      </div>
    );
  }

  const threads = await listPublicForumThreads(categorySlug, reader, { page, limit: 20 });
  if (!threads) {
    // The category was visible a moment ago; treat as unavailable anyway —
    // the gate is authoritative and we never half-render.
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Forum category not available</h1>
          <Link href="/forums" className="text-blue-600 dark:text-blue-400 hover:underline">
            Back to Community Forums
          </Link>
        </div>
      </div>
    );
  }

  function pageHref(target: number): string {
    return target > 1 ? `/forums/${categorySlug}?page=${target}` : `/forums/${categorySlug}`;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/forums"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            All categories
          </Link>
          <h1 className="text-3xl font-bold">{category.displayName}</h1>
          {category.description && (
            <p className="text-muted-foreground mt-2">{category.description}</p>
          )}
          <p className="text-sm text-muted-foreground mt-2">
            {category.postCount} thread{category.postCount === 1 ? "" : "s"}
            {category.lastPostAt &&
              ` · Last activity ${format(category.lastPostAt, "MMM d, yyyy")}`}
          </p>
        </div>

        {/* Participation */}
        <div className="mb-8">
          <CreatePostForm categoryId={category.id} categorySlug={category.name} />
        </div>

        {/* Thread list */}
        {threads.items.length === 0 ? (
          <EmptyState
            title="No threads yet"
            description="Be the first to start a conversation in this category — published threads appear here."
            className="border rounded-lg bg-card"
          />
        ) : (
          <div className="space-y-3">
            {threads.items.map((thread) => (
              <ThreadRow key={thread.id} thread={thread} categorySlug={category.name} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {threads.totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-4 text-sm">
            {threads.page > 1 ? (
              <Link
                href={pageHref(threads.page - 1)}
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                ← Newer
              </Link>
            ) : (
              <span className="text-muted-foreground">← Newer</span>
            )}
            <span className="text-muted-foreground">
              Page {threads.page} of {threads.totalPages}
            </span>
            {threads.page < threads.totalPages ? (
              <Link
                href={pageHref(threads.page + 1)}
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Older →
              </Link>
            ) : (
              <span className="text-muted-foreground">Older →</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
