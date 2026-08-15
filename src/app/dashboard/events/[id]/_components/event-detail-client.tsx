"use client";

/**
 * Client body of the dashboard event detail page. Receives the signed-in
 * user's id (or null) from the server wrapper so the organizer gate compares
 * real ids — never a hardcoded placeholder.
 */

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { EventLayout } from "@/components/events";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AsyncContent } from "@/components/ui/async-content";
import { PageHeader } from "@/components/dashboard/page-header";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ArrowLeft, Edit, Share2, QrCode } from "lucide-react";
import { toast } from "sonner";
import { RegistrationStatus } from "@/types/event";
import { useEvent } from "@/lib/hooks/use-events";
import { logger } from "@/lib/logger";

interface EventDetailClientProps {
  /** Signed-in user's id, or null when unavailable. */
  currentUserId: string | null;
}

export function EventDetailClient({ currentUserId }: EventDetailClientProps) {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const { event, data, isRegistered, isLoading, error, refetch } = useEvent(eventId);
  const registration = data?.registration || null;

  const isOrganizer = currentUserId !== null && event?.organizerId === currentUserId;

  const handleRegister = (eventId: string) => {
    router.push(`/events/${eventId}/register`);
  };

  const _handleCancelRegistration = (eventId: string) => {
    // Handle cancellation logic
    logger.info("Cancel registration for event", eventId);
  };

  const handleCheckIn = (eventId: string) => {
    router.push(`/events/${eventId}/check-in`);
  };

  const handleShare = async (_eventId: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event?.title,
          text: event?.shortDescription,
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
    router.push(`/dashboard/events?form=${eventId}`);
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <>
      <PageHeader title={event?.title ?? "Event Details"} description={event?.shortDescription} />
      <AsyncContent
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        loadingComponent={
          <div className="flex h-64 items-center justify-center">
            <LoadingSpinner size="lg" />
          </div>
        }
        errorComponent={
          <div className="py-12 text-center">
            <h2 className="mb-2 text-2xl font-bold text-foreground/90">Event Not Found</h2>
            <p className="mb-6 text-foreground/60">
              {error || "The event you're looking for doesn't exist or has been removed."}
            </p>
            <Button onClick={handleGoBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Events
            </Button>
          </div>
        }
      >
        {event && (
          <EventLayout
            embedded
            event={event}
            isRegistered={isRegistered}
            onRegister={() => handleRegister(event.id)}
            onShare={() => handleShare(event.id)}
            onEdit={() => handleEdit(event.id)}
            showActions={true}
          >
            {/* Additional sections can be added here */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Organizer Info */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-4">Organized by</h3>
                  <div className="flex items-center">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mr-4">
                      <span className="text-foreground/70 font-medium">
                        {(event.organizer?.displayName || event.organizer?.username || "O")
                          .charAt(0)
                          .toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">
                        {event.organizer?.displayName ||
                          event.organizer?.username ||
                          "Event Organizer"}
                      </p>
                      <p className="text-sm text-foreground/60">Event Organizer</p>
                    </div>
                  </div>
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
        )}
      </AsyncContent>
    </>
  );
}
