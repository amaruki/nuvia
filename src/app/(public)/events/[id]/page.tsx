/**
 * Public event detail — server wrapper (plan item UI-03, UI-19 item 2,
 * organizer credit UI-30, announcement banner UI-32).
 *
 * Server-first source of truth: resolves the event detail (with the viewer's
 * registration state) here, once, and hands it to the client body, which
 * renders exactly this and never re-fetches. A null result renders the
 * not-found card through the client body — same content the client fetch
 * used to show for a missing event.
 *
 * Resolves the signed-in user's id server-side (null for anonymous visitors)
 * and hands it to the client body so the organizer gate compares real ids.
 * Also resolves the organizer's public-profile credit (UI-28 service) so the
 * client can link the organizer to /members/[id] only when they opted in.
 */

import { getCurrentUser } from "@/lib/auth/utils/session";
import { getEventDetail } from "@/lib/services/event-read.service";
import { getOrganizerCredit } from "@/lib/services/member/public-profile";
import { listEventAnnouncements } from "@/lib/services/content/member-announcements";

import { EventDetailClient } from "./_components/event-detail-client";
import { EventAnnouncementBanner } from "./_components/announcement-banner";

export const dynamic = "force-dynamic";

interface EventDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function EventDetailsPage({ params }: EventDetailsPageProps) {
  const { id } = await params;
  const user = await getCurrentUser();

  // The credit is supplementary: it is only resolved when the event detail
  // itself resolved, same as the announcement banner below.
  const detail = await getEventDetail(id, user?.id ?? undefined);
  const organizerCredit = detail ? await getOrganizerCredit(detail.event.organizerId) : null;

  // UI-32: announcements targeting this event, resolved server-side through
  // the member-safe read path. Anonymous visitors only ever get PUBLIC rows.
  // Resolved only when the event detail itself resolved, so a missing or
  // audience-gated event cannot leak its banners.
  const announcements = detail
    ? await listEventAnnouncements(id, {
        authenticated: user !== null,
        // Issue #23: MEMBERS_ONLY banners require an entitled member status,
        // not merely a session.
        userId: user?.id ?? null,
      })
    : [];

  return (
    <>
      <EventAnnouncementBanner announcements={announcements} />
      <EventDetailClient
        detail={detail}
        currentUserId={user?.id ?? null}
        organizerCredit={organizerCredit}
      />
    </>
  );
}
