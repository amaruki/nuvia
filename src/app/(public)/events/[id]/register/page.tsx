"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { EventRegistrationForm } from "@/components/events";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CheckCircle, AlertCircle, Clock, Hourglass, LogIn } from "lucide-react";
import { Event, EventRegistration } from "@/types/event";
import { getEventById, registerForEvent } from "@/lib/services/event";
import { useSession } from "@/lib/client";
import { EventLayout } from "@/components/events/event-layout";

export default function EventRegistrationPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  const { data: session, isPending } = useSession();

  const [event, setEvent] = React.useState<Event | null>(null);
  const [existingRegistration, setExistingRegistration] = React.useState<EventRegistration | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchEventData = async () => {
      try {
        setIsLoading(true);

        // Fetch event details
        const eventResponse = await getEventById(eventId);
        setEvent(eventResponse.event);

        // Check if user is already registered
        if (eventResponse.isRegistered && eventResponse.registration) {
          setExistingRegistration(eventResponse.registration);
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

  const handleRegister = async (data: { eventId: string; notes?: string }) => {
    try {
      setIsSubmitting(true);

      const response = await registerForEvent({
        eventId: data.eventId,
        notes: data.notes,
      });

      if (response.success) {
        toast.success("Registration successful!");
        router.push(`/events/${eventId}`);
      } else {
        toast.error(response.message || "Registration failed");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  // Session gate (same pattern as the jobs apply form): registration writes a
  // NOT NULL user reference, so anonymous visitors are routed to login and
  // returned to this page via redirectTo.
  if (isPending) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Register for this event</CardTitle>
              <CardDescription>Checking your session...</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Register for this event</CardTitle>
              <CardDescription>
                Sign in to register for this event and track your registration status.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild size="lg" className="w-full">
                <Link
                  href={`/auth/login?redirectTo=${encodeURIComponent(`/events/${eventId}/register`)}`}
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign in to register
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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

  // If user is already registered, show registration status
  if (existingRegistration) {
    return (
      <EventLayout event={event} showActions={false}>
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                {existingRegistration.status === "confirmed" ? (
                  <CheckCircle className="h-5 w-5 text-success mr-2" />
                ) : existingRegistration.status === "pending" ? (
                  <Clock className="h-5 w-5 text-warning mr-2" />
                ) : existingRegistration.status === "waitlisted" ? (
                  <Hourglass className="h-5 w-5 text-warning mr-2" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-destructive mr-2" />
                )}
                Registration Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6">
                {existingRegistration.status === "confirmed" && (
                  <>
                    <CheckCircle className="h-16 w-16 text-success mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-foreground/90 mb-2">
                      You're Registered!
                    </h3>
                    <p className="text-foreground/60 mb-6">
                      You have successfully registered for {event.title}. A confirmation email has
                      been sent to your registered email address.
                    </p>
                  </>
                )}

                {existingRegistration.status === "pending" && (
                  <>
                    <Clock className="h-16 w-16 text-warning mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-foreground/90 mb-2">
                      Registration Pending
                    </h3>
                    <p className="text-foreground/60 mb-6">
                      Your registration for {event.title} is being reviewed. You will receive an
                      email once your registration is approved.
                    </p>
                  </>
                )}

                {existingRegistration.status === "waitlisted" && (
                  <>
                    <Hourglass className="h-16 w-16 text-warning mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-foreground/90 mb-2">
                      You're on the Waitlist
                    </h3>
                    <p className="text-foreground/60 mb-6">
                      {event.title} is currently at full capacity. If a confirmed attendee cancels,
                      your registration will be promoted automatically.
                    </p>
                  </>
                )}

                {existingRegistration.status === "cancelled" && (
                  <>
                    <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-foreground/90 mb-2">
                      Registration Cancelled
                    </h3>
                    <p className="text-foreground/60 mb-6">
                      Your registration for {event.title} has been cancelled. If you'd like to
                      register again, please contact the event organizer.
                    </p>
                  </>
                )}

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
        <EventRegistrationForm
          event={event}
          onSubmit={handleRegister}
          isSubmitting={isSubmitting}
        />
      </div>
    </EventLayout>
  );
}
