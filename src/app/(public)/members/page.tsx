/**
 * Public member directory (UI-28, decision D7).
 *
 * Server Component reading through `listPublicMembers` — the only read path
 * allowed to surface user rows publicly; it selects an allow-list of columns
 * and only ever returns users who opted in (`profilePublic`, default off).
 * Search and pagination travel in the URL so the page works without JS.
 */

import type { Metadata } from "next";
import { Users } from "lucide-react";

import { EventListLayout } from "@/components/events/event-list-layout";
import { EmptyState } from "@/components/ui/empty-state";
import { listPublicMembers } from "@/lib/services/member/public-profile";

import { MemberCard } from "./_components/member-card";
import { MemberPagination } from "./_components/member-pagination";
import { MemberSearch } from "./_components/member-search";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const metadata: Metadata = {
  title: "Member Directory",
  description: "Members who chose to appear in the public directory.",
};

// Profiles change at runtime; never serve a build-time snapshot.
export const dynamic = "force-dynamic";

const PAGE_SIZE = 24;

interface MembersPageProps {
  searchParams: Promise<{ query?: string; page?: string }>;
}

export default async function MembersPage({ searchParams }: MembersPageProps) {
  const params = await searchParams;
  const query = typeof params.query === "string" ? params.query.trim() : "";
  const requestedPage = Number.parseInt(params.page ?? "1", 10);

  const { members, total, page, totalPages } = await listPublicMembers({
    query: query || undefined,
    page: Number.isFinite(requestedPage) ? requestedPage : 1,
    limit: PAGE_SIZE,
  });

  return (
    <EventListLayout
      title="Member Directory"
      description="Members who chose to make their profile public"
      icon={<Users aria-hidden="true" className="h-8 w-8 text-primary" />}
      showBackButton={false}
    >
      <div className="space-y-6">
        <MemberSearch defaultValue={query} />

        {members.length === 0 ? (
          <EmptyState
            title={query ? "No members match your search" : "No public profiles yet"}
            description={
              query
                ? "Try a different name or keyword, or clear the search."
                : "Members appear here only after they opt in to the public directory."
            }
            icon={
              <Users aria-hidden="true" className="h-12 w-12 text-muted-foreground opacity-40" />
            }
          />
        ) : (
          <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {members.map((member) => (
              <li key={member.id}>
                <MemberCard member={member} />
              </li>
            ))}
          </ul>
        )}

        <MemberPagination page={page} totalPages={totalPages} total={total} query={query} />
      </div>
    </EventListLayout>
  );
}
