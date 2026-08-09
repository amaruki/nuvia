/**
 * UI-32 — Latest announcement widget (member home).
 *
 * Surfaces the single newest audience-ready announcement (PUBLISHED,
 * visibility PUBLIC or MEMBERS_ONLY, already published) with a link to the
 * full view and an "All announcements" shortcut. The link target depends on
 * visibility: PUBLIC announcements open at `/news/<slug>`, MEMBERS_ONLY ones
 * open in the members' announcement inbox at `/dashboard/announcements`.
 * When nothing qualifies it renders an honest empty state — never a stub.
 *
 * Server component.
 */

import Link from "next/link";
import { Megaphone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type { LatestAnnouncementData } from "@/lib/services/member/home";
import { getRelativeTime } from "@/lib/utils/date-utils";

interface MemberAnnouncementWidgetProps {
  announcement: LatestAnnouncementData | null;
}

const ANNOUNCEMENTS_PAGE_HREF = "/dashboard/announcements";

export function MemberAnnouncementWidget({ announcement }: MemberAnnouncementWidgetProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-muted-foreground" aria-hidden />
          Announcements
        </CardTitle>
        <CardDescription>The latest from the community</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {announcement ? (
          <>
            <article className="space-y-1">
              <h3 className="font-medium">{announcement.title}</h3>
              {announcement.excerpt ? (
                <p className="line-clamp-3 text-sm text-muted-foreground">{announcement.excerpt}</p>
              ) : null}
              <p className="text-sm text-muted-foreground">
                {getRelativeTime(announcement.publishedAt)}
                {announcement.authorName ? ` · ${announcement.authorName}` : ""}
              </p>
            </article>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" variant="outline">
                <Link
                  href={
                    announcement.visibility === "PUBLIC"
                      ? `/news/${announcement.slug}`
                      : ANNOUNCEMENTS_PAGE_HREF
                  }
                >
                  Read announcement
                </Link>
              </Button>
              <Button asChild size="sm" variant="ghost">
                <Link href={ANNOUNCEMENTS_PAGE_HREF}>All announcements</Link>
              </Button>
            </div>
          </>
        ) : (
          <EmptyState
            title="No announcements yet"
            description="When there's news for members it will appear here."
            icon={<Megaphone className="h-8 w-8 text-muted-foreground" />}
            actions={
              <Button asChild size="sm" variant="outline">
                <Link href={ANNOUNCEMENTS_PAGE_HREF}>All announcements</Link>
              </Button>
            }
          />
        )}
      </CardContent>
    </Card>
  );
}
