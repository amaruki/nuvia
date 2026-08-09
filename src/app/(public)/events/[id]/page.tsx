/**
 * Public event detail — server wrapper (plan item UI-03).
 *
 * Resolves the signed-in user's id server-side (null for anonymous visitors)
 * and hands it to the client body so the organizer gate compares real ids.
 */

import { getCurrentUser } from "@/lib/auth/utils/session";
import { EventDetailClient } from "./_components/event-detail-client";

export const dynamic = "force-dynamic";

export default async function EventDetailsPage() {
  const user = await getCurrentUser();
  return <EventDetailClient currentUserId={user?.id ?? null} />;
}
