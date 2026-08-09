/**
 * Member self check-in page (UI-24 item 5, roadmap D4).
 *
 * Session-gated: anonymous visitors are sent to login with a redirect back
 * here. All state is resolved server-side for the session user, so the QR
 * credential is only ever rendered to the registration owner.
 */

import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, CalendarClock, CheckCircle2 } from "lucide-react";

import { getCurrentUser } from "@/lib/auth/utils/session";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSelfCheckInView } from "@/lib/services/event-self-check-in.service";
import { formatDate, formatTime } from "@/lib/utils/event-utils";

import { SelfCheckInCard } from "./_components/self-check-in-card";

export const dynamic = "force-dynamic";

interface SelfCheckInPageProps {
  params: Promise<{ id: string }>;
}

const NOT_CONFIRMED_COPY: Record<string, string> = {
  PENDING:
    "Your registration is still awaiting approval. Check-in becomes available once it is confirmed.",
  WAITLISTED:
    "You are on the waitlist for this event. Check-in is only available for confirmed registrations.",
  CANCELED: "Your registration was canceled, so check-in is unavailable.",
  NO_SHOW: "This registration was marked as no-show, so check-in is unavailable.",
};

export default async function SelfCheckInPage({ params }: SelfCheckInPageProps) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/auth/login?redirectTo=${encodeURIComponent(`/events/${id}/self-check-in`)}`);
  }

  const view = await getSelfCheckInView(id, user.id);

  if (view.status === "event-not-found") {
    return (
      <div className="max-w-lg mx-auto px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Event not found</CardTitle>
            <CardDescription>This event does not exist or was removed.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/events">Browse events</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const eventSummary = view.event;

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <Button asChild variant="ghost" className="mb-6 -ml-2">
        <Link href={`/events/${id}`}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to event
        </Link>
      </Button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold">Self Check-In</h1>
        <p className="text-muted-foreground mt-1">{eventSummary.title}</p>
        <p className="text-muted-foreground text-sm flex items-center gap-1.5 mt-1">
          <CalendarClock className="h-4 w-4" />
          {formatDate(eventSummary.startTime)} · {formatTime(eventSummary.startTime)} –{" "}
          {formatTime(eventSummary.endTime)}
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          {view.status === "no-registration" && (
            <div className="space-y-3">
              <p>You are not registered for this event, so there is nothing to check in with.</p>
              <Button asChild>
                <Link href={`/events/${id}/register`}>Register for this event</Link>
              </Button>
            </div>
          )}

          {view.status === "not-confirmed" && (
            <p>
              {NOT_CONFIRMED_COPY[view.registrationStatus] ?? "This registration cannot check in."}
            </p>
          )}

          {view.status === "already-checked-in" && (
            <div className="text-center" role="status">
              <CheckCircle2 className="mx-auto h-10 w-10 text-success" />
              <p className="mt-3 font-medium">You&apos;re already checked in.</p>
              <p className="text-muted-foreground mt-1 text-sm">
                Checked in {formatDate(view.checkedInAt)} at {formatTime(view.checkedInAt)}.
              </p>
            </div>
          )}

          {view.status === "ready" && (
            <SelfCheckInCard
              eventId={id}
              qrCode={view.qrCode}
              phase={view.phase}
              opensAt={view.window.opensAt}
              closesAt={view.window.closesAt}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
