"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { EventCheckIn } from "@/components/events";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, AlertCircle, CheckCircle, QrCode } from "lucide-react";
import { Event, EventRegistration } from "@/types/event";
import { getEventById, checkInToEvent } from "@/lib/services/event";
import { EventLayout } from "@/components/events/event-layout";

export default function EventCheckInPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const [event, setEvent] = React.useState<Event | null>(null);
  const [registration, setRegistration] = React.useState<EventRegistration | null>(null);
  const [searchResults, setSearchResults] = React.useState<EventRegistration[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [checkInSuccess, setCheckInSuccess] = React.useState(false);
  const [checkInError, setCheckInError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchEventData = async () => {
      try {
        setIsLoading(true);

        // Fetch event details
        const eventResponse = await getEventById(eventId);
        setEvent(eventResponse.event);

        // Check if user is registered
        if (eventResponse.isRegistered && eventResponse.registration) {
          setRegistration(eventResponse.registration);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch event details");
      } finally {
        setIsLoading(false);
      }
    };

    if (eventId) {
      fetchEventData();
    }
  }, [eventId]);

  const handleCheckIn = async (data: {
    eventId: string;
    registrationId?: string;
    checkInMethod: string;
    verificationCode?: string;
  }) => {
    try {
      setIsSubmitting(true);
      setCheckInError(null);

      const response = await checkInToEvent({
        eventId: data.eventId,
        registrationId: data.registrationId,
        checkInMethod: data.checkInMethod as "qr" | "manual" | "app",
        verificationCode: data.verificationCode,
      });

      if (response.success) {
        setCheckInSuccess(true);
        // Refresh registration data
        if (response.data?.registration) {
          setRegistration(response.data.registration);
        }
      } else {
        setCheckInError(response.message || "Check-in failed");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Check-in failed";
      setCheckInError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSearchRegistration = async (searchTerm: string) => {
    // In a real implementation, this would call an API to search for registrations
    // For now, we'll just mock some results
    alert(`Searching for registrations with term: ${searchTerm}`);
    setSearchResults([]); // Reset search results
  };

  const handleGoBack = () => {
    router.back();
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  const isEventToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
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
    );
  }

  // If event is not today, show a message
  if (!isEventToday(event.startDate)) {
    return (
      <EventLayout event={event} showActions={false}>
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertCircle className="h-5 w-5 text-warning mr-2" />
                Check-in Not Available
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6">
                <QrCode className="h-16 w-16 text-foreground/40 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground/90 mb-2">
                  Check-in is only available on the day of the event
                </h3>
                <p className="text-foreground/60 mb-6">
                  This event is scheduled for {formatDate(event.startDate)}. Please return on that
                  day to check in.
                </p>
                <div className="flex justify-center space-x-4">
                  <Button onClick={() => router.push(`/events/${eventId}`)}>
                    View Event Details
                  </Button>
                  <Button variant="outline" onClick={handleGoBack}>
                    Back to Events
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </EventLayout>
    );
  }

  // If user is already checked in, show success message
  if (registration?.checkedInAt) {
    return (
      <EventLayout event={event} showActions={false}>
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="h-5 w-5 text-success mr-2" />
                Already Checked In
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6">
                <CheckCircle className="h-16 w-16 text-success mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground/90 mb-2">
                  You're Checked In!
                </h3>
                <p className="text-foreground/60 mb-6">
                  You have already checked in for {event.title} at{" "}
                  {registration.checkedInAt.toLocaleTimeString()}.
                </p>
                <div className="flex justify-center space-x-4">
                  <Button onClick={() => router.push(`/events/${eventId}`)}>
                    View Event Details
                  </Button>
                  <Button variant="outline" onClick={handleGoBack}>
                    Back to Events
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </EventLayout>
    );
  }

  // If check-in was successful, show success message
  if (checkInSuccess) {
    return (
      <EventLayout event={event} showActions={false}>
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="h-5 w-5 text-success mr-2" />
                Check-in Successful
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6">
                <CheckCircle className="h-16 w-16 text-success mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground/90 mb-2">
                  You're Checked In!
                </h3>
                <p className="text-foreground/60 mb-6">
                  You have successfully checked in for {event.title}. Enjoy the event!
                </p>
                <div className="flex justify-center space-x-4">
                  <Button onClick={() => router.push(`/events/${eventId}`)}>
                    View Event Details
                  </Button>
                  <Button variant="outline" onClick={handleGoBack}>
                    Back to Events
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </EventLayout>
    );
  }

  return (
    <EventLayout event={event} showActions={false}>
      <div className="max-w-2xl mx-auto">
        {checkInError && (
          <div className="mb-6 bg-destructive/10 border border-destructive/30 text-destructive p-4 rounded-lg">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-destructive mr-2 flex-shrink-0" />
              <div>
                <p className="font-medium">Check-in Failed</p>
                <p className="text-sm mt-1">{checkInError}</p>
              </div>
            </div>
          </div>
        )}

        <EventCheckIn
          event={event}
          onCheckIn={handleCheckIn}
          onSearchRegistration={handleSearchRegistration}
          isSubmitting={isSubmitting}
          searchResults={searchResults}
        />
      </div>
    </EventLayout>
  );
}
