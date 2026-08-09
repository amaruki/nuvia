/**
 * Public event detail — server wrapper (plan item UI-03, organizer credit
 * UI-30).
 *
 * Resolves the signed-in user's id server-side (null for anonymous visitors)
 * and hands it to the client body so the organizer gate compares real ids.
 * Also resolves the organizer's public-profile credit (UI-28 service) so the
 * client can link the organizer to /members/[id] only when they opted in.
 */

import { getCurrentUser } from "@/lib/auth/utils/session";
import { getEventDetail } from "@/lib/services/event-read.service";
import { getOrganizerCredit } from "@/lib/services/member/public-profile";

import { EventDetailClient } from "./_components/event-detail-client";

export const dynamic = "force-dynamic";

interface EventDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function EventDetailsPage({ params }: EventDetailsPageProps) {
  const { id } = await params;
  const user = await getCurrentUser();

  // The credit is supplementary: if the server-side event lookup fails, the
  // client still renders its own loading/error states through useEvent.
  const detail = await getEventDetail(id, user?.id ?? undefined);
  const organizerCredit = detail ? await getOrganizerCredit(detail.event.organizerId) : null;

  return <EventDetailClient currentUserId={user?.id ?? null} organizerCredit={organizerCredit} />;
}
