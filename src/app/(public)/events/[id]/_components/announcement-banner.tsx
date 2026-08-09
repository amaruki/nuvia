/**
 * UI-32 — Event-page announcement banner.
 *
 * Renders the announcements that target this event, resolved server-side by
 * the server wrapper through the member-safe read path
 * (src/lib/services/content/member-announcements.ts): PUBLISHED rows at
 * member visibility (PUBLIC only for anonymous visitors), with targeting via
 * metadata.ui.targetEventId and expiry via metadata.ui.expiresAt honored.
 *
 * GAP (reported): the content schema has no event-targeting column and the
 * backoffice form/schema cannot write metadata.ui.targetEventId yet, so this
 * region renders nothing until that write path exists. The read path is
 * proven against seeded rows in tests/member-announcements.test.ts.
 *
 * Deliberately no link: MEMBERS_ONLY announcements have no public detail
 * route, so linking would be dishonest for them; the banner shows title and
 * excerpt only. Server component — no client state needed.
 */

import { Megaphone } from "lucide-react";
import type { EventAnnouncement } from "@/lib/services/content/member-announcements";

interface EventAnnouncementBannerProps {
  announcements: EventAnnouncement[];
}

export function EventAnnouncementBanner({ announcements }: EventAnnouncementBannerProps) {
  if (announcements.length === 0) {
    return null;
  }

  return (
    <div className="bg-background">
      <section
        aria-label="Announcements for this event"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-3"
      >
        {announcements.map((announcement) => (
          <div
            key={announcement.id}
            className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3"
          >
            <Megaphone className="h-5 w-5 mt-0.5 shrink-0 text-primary" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">{announcement.title}</p>
              {announcement.excerpt && (
                <p className="mt-0.5 text-sm text-muted-foreground">{announcement.excerpt}</p>
              )}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
