/**
 * UI-32 — Member announcement inbox (decision D11).
 *
 * Server component per ADR-0006: session-gated, reads through the
 * member-safe content read path (src/lib/services/content/member-announcements.ts)
 * — never the content:read-gated admin API. Lists PUBLISHED announcements at
 * member visibility (PUBLIC or MEMBERS_ONLY) whose publish date has passed,
 * newest first, paginated. Expired announcements stay in the inbox (it is
 * the archive; expiry only retires event-page banners).
 *
 * Not in the nav sidebar by design this wave — MemberHome (owned by another
 * agent) links here. With no nav entry, getRequiredRolesForPath returns null
 * and every authenticated member can open it (ring 1).
 */

import Link from "next/link";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { Megaphone } from "lucide-react";

import { getCurrentUser } from "@/lib/auth/utils/session";
import { listMemberAnnouncements } from "@/lib/services/content/member-announcements";
import { InboxHeader } from "./_components/inbox-header";

export const dynamic = "force-dynamic";

function parsePage(value: string | string[] | undefined): number {
  if (typeof value !== "string") return 1;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function pageHref(page: number): string {
  return page > 1 ? `/dashboard/announcements?page=${page}` : "/dashboard/announcements";
}

export default async function MemberAnnouncementsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login");
  }

  const sp = await searchParams;
  const page = parsePage(sp.page);

  const { items, total, totalPages } = await listMemberAnnouncements({ page, limit: 10 });

  return (
    <div className="space-y-6 animate-fadeInUp max-w-3xl">
      <InboxHeader />

      <p className="text-sm text-muted-foreground">
        {total} announcement{total === 1 ? "" : "s"}
      </p>

      {items.length === 0 ? (
        <div className="text-center py-16 border rounded-lg bg-card">
          <Megaphone className="h-12 w-12 mx-auto mb-3 text-foreground/30" />
          <h3 className="font-medium text-foreground/80 mb-1">No announcements yet</h3>
          <p className="text-sm text-muted-foreground">
            When an announcement is published to members, it will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <article key={item.id} className="rounded-lg border bg-card p-4 space-y-2">
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <time dateTime={item.publishedAt.toISOString()}>
                  {format(item.publishedAt, "MMMM d, yyyy")}
                </time>
                {item.author?.name && <span>By {item.author.name}</span>}
              </div>
              <h2 className="text-lg font-semibold">{item.title}</h2>
              {item.excerpt && <p className="text-sm text-muted-foreground">{item.excerpt}</p>}
              {item.content && (
                <details>
                  <summary className="cursor-pointer text-sm text-blue-600 hover:underline">
                    Read the full announcement
                  </summary>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                    {item.content}
                  </p>
                </details>
              )}
            </article>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <nav aria-label="Announcement pages" className="flex items-center justify-center gap-4">
          {page > 1 ? (
            <Link
              href={pageHref(page - 1)}
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              ← Previous
            </Link>
          ) : (
            <span className="text-sm text-muted-foreground" aria-disabled="true">
              ← Previous
            </span>
          )}
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          {page < totalPages ? (
            <Link
              href={pageHref(page + 1)}
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              Next →
            </Link>
          ) : (
            <span className="text-sm text-muted-foreground" aria-disabled="true">
              Next →
            </span>
          )}
        </nav>
      )}
    </div>
  );
}
