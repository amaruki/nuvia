"use client";

/**
 * Client body of the public event detail page (UI-19 item 2, ADR-0006).
 *
 * The event detail is resolved once by the server wrapper (page.tsx) through
 * getEventDetail and passed down as the source of truth — this component no
 * longer re-fetches it via useEvent. It stays a client component only for
 * genuine interactivity: register/cancel/check-in/share/edit actions and
 * router navigation. After the cancel mutation succeeds, router.refresh()
 * re-runs the server wrapper so the registration state is re-resolved.
 *
 * Receives the signed-in user's id (or null when anonymous) from the server
 * wrapper so the organizer gate compares real ids — never a hardcoded
 * placeholder.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { EventLayout } from "@/components/events";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Ban, Edit, Share2, QrCode } from "lucide-react";
import { RegistrationStatus } from "@/types/event";
import type { Event, EventRegistration } from "@/types/event";
import { cancelEventRegistration } from "@/lib/services/event";
import { toast } from "sonner";
import type { OrganizerCredit } from "@/lib/services/member/public-profile";

import { OrganizerCreditCard } from "./organizer-credit";

/** The server-resolved event detail fields this body renders. */
export interface EventDetailData {
  event: Event;
  isRegistered: boolean;
  registration?: EventRegistration;
}

interface EventDetailClientProps {
  /** Signed-in user's id, or null for anonymous visitors. */
  currentUserId: string | null;
  /** UI-30: organizer credit resolved server-side; null when unknown. */
  organizerCredit: OrganizerCredit | null;
  /**
   * Event detail resolved server-side by the page wrapper; null when the
   * event does not exist. Never re-fetched client-side.
   */
  detail: EventDetailData | null;
}

export function EventDetailClient({
  currentUserId,
  organizerCredit,
  detail,
}: EventDetailClientProps) {
  const router = useRouter();

  const handleGoBack = () => {
    router.back();
  };

  // Missing event: the server wrapper resolved null. Render the same
  // not-found card the client fetch used to show for this case.
  if (!detail) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-foreground/90 mb-2">Event Not Found</h1>
          <p className="text-foreground/60 mb-6">
            The event you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={handleGoBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Events
          </Button>
        </div>
      </div>
    );
  }

  const { event, isRegistered } = detail;
  const registration = detail.registration || null;

  const isOrganizer = currentUserId !== null && event.organizerId === currentUserId;

  const handleRegister = (eventId: string) => {
    router.push(`/events/${eventId}/register`);
  };

  const handleCancelRegistration = async (eventId: string) => {
    try {
      const response = await cancelEventRegistration(eventId);
      if (response.success) {
        // The detail is server-resolved: re-run the server wrapper so the
        // updated registration state is re-read from the database.
        router.refresh();
      } else {
        toast.error(response.message || "Failed to cancel registration");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to cancel registration");
    }
  };

  const handleCheckIn = (eventId: string) => {
    router.push(`/events/${eventId}/check-in`);
  };

  const handleShare = async (_eventId: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: event.shortDescription,
          url: window.location.href,
        });
      } catch (error) {
        // Dismissing the native share sheet rejects with AbortError — not a failure.
        if (error instanceof Error && error.name === "AbortError") return;
        toast.error("Could not share the event link");
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Event link copied to clipboard!");
      } catch {
        toast.error("Could not copy the event link");
      }
    }
  };

  const handleEdit = (eventId: string) => {
    router.push(`/events/${eventId}/edit`);
  };

  return (
    <EventLayout
      event={event}
      isRegistered={isRegistered}
      onRegister={() => handleRegister(event.id)}
      onShare={() => handleShare(event.id)}
      onEdit={() => handleEdit(event.id)}
      showActions={true}
    >
      {/* Additional sections can be added here */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Organizer Info */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-lg mb-4">Organized by</h3>
            <OrganizerCreditCard
              credit={organizerCredit}
              fallbackName={event.organizer?.displayName ?? "Event Organizer"}
            />
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-lg mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Button
                variant="outline"
                onClick={() => handleShare(event.id)}
                className="w-full justify-start"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share Event
              </Button>

              {isRegistered && registration?.status === RegistrationStatus.CONFIRMED && (
                <Button
                  variant="outline"
                  onClick={() => handleCheckIn(event.id)}
                  className="w-full justify-start"
                >
                  <QrCode className="h-4 w-4 mr-2" />
                  Check In
                </Button>
              )}

              {isRegistered &&
                registration &&
                registration.status !== RegistrationStatus.CANCELLED && (
                  <Button
                    variant="outline"
                    onClick={() => handleCancelRegistration(event.id)}
                    className="w-full justify-start"
                  >
                    <Ban className="h-4 w-4 mr-2" />
                    Cancel Registration
                  </Button>
                )}

              {isOrganizer && (
                <Button
                  variant="outline"
                  onClick={() => handleEdit(event.id)}
                  className="w-full justify-start"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Event
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Similar Events */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-lg mb-4">Similar Events</h3>
            <p className="text-foreground/60 text-sm">
              More events like this will be shown here based on your interests.
            </p>
          </CardContent>
        </Card>
      </div>
    </EventLayout>
  );
}
