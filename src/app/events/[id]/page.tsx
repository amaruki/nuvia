"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { EventLayout } from "@/components/events";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AsyncContent } from "@/components/ui/async-content";
import { ArrowLeft, Edit, Share2, QrCode } from "lucide-react";
import { EventRegistration, RegistrationStatus } from "@/types/event.types";
import { useEvent } from "@/lib/hooks/use-events";
import { formatDateLong, formatEventTimeRange } from "@/lib/utils/event-utils";

export default function EventDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  
  const { event, data, isRegistered, isLoading, error, refetch } = useEvent(eventId);
  const registration = data?.registration || null;

  const handleRegister = (eventId: string) => {
    router.push(`/events/${eventId}/register`);
  };

  const handleCancelRegistration = (eventId: string) => {
    // Handle cancellation logic
    console.log("Cancel registration for event:", eventId);
  };

  const handleCheckIn = (eventId: string) => {
    router.push(`/events/${eventId}/check-in`);
  };

  const handleShare = (eventId: string) => {
    // Handle share logic
    if (navigator.share) {
      navigator.share({
        title: event?.title,
        text: event?.shortDescription,
        url: window.location.href,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert("Event link copied to clipboard!");
    }
  };

  const handleEdit = (eventId: string) => {
    router.push(`/events/${eventId}/edit`);
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <AsyncContent
      isLoading={isLoading}
      error={error}
      onRetry={refetch}
      loadingComponent={
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        </div>
      }
      errorComponent={
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-foreground/90 mb-2">Event Not Found</h1>
            <p className="text-foreground/60 mb-6">
              {error || "The event you're looking for doesn't exist or has been removed."}
            </p>
            <Button onClick={handleGoBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Events
            </Button>
          </div>
        </div>
      }
    >
      {event && (
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
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mr-4">
                    <span className="text-foreground/70 font-medium">
                      {(event.organizer?.displayName || event.organizer?.username || "O").charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">
                      {event.organizer?.displayName || event.organizer?.username || "Event Organizer"}
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
                  
                  {event.organizerId === "current-user-id" && ( // This should be replaced with actual user ID
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
  );
}