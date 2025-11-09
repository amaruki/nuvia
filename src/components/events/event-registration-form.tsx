"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Event, RegistrationStatus } from "@/types/event.types";
import { eventRegistrationSchema, type EventRegistrationInput } from "@/lib/validation/event.validation";
import {
  formatDateLong,
  formatTime,
  isRegistrationOpen,
  isEventFull,
  formatEventTimeRange
} from "@/lib/utils/event-utils";

interface EventRegistrationFormProps {
  event: Event;
  onSubmit: (data: EventRegistrationInput) => void;
  isSubmitting?: boolean;
  className?: string;
}

export function EventRegistrationForm({
  event,
  onSubmit,
  isSubmitting = false,
  className = "",
}: EventRegistrationFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EventRegistrationInput>({
    resolver: zodResolver(eventRegistrationSchema),
    defaultValues: {
      eventId: event.id,
      notes: "",
    },
  });

  const onFormSubmit = (data: EventRegistrationInput) => {
    onSubmit(data);
  };

  const registrationOpen = isRegistrationOpen(event.startDate, event.registrationDeadline);
  const eventFull = isEventFull(event.currentAttendees, event.maxAttendees);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Register for {event.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Event Information */}
          <div className="bg-background p-4 rounded-lg">
            <h3 className="font-medium mb-2" style={{ color: 'var(--foreground)' }}>Event Details</h3>
            <div className="space-y-2 text-sm" style={{ color: 'var(--muted-foreground)' }}>
              <p>
                <span className="font-medium">Date:</span> {formatDateLong(event.startDate)}
              </p>
              <p>
                <span className="font-medium">Time:</span> {formatEventTimeRange(event.startDate, event.endDate)}
              </p>
              <p>
                <span className="font-medium">Location:</span> {event.location}
              </p>
              {event.maxAttendees && (
                <p>
                  <span className="font-medium">Availability:</span> {event.currentAttendees} of {event.maxAttendees} spots filled
                </p>
              )}
            </div>
          </div>

          {/* Registration Status Messages */}
          {!registrationOpen && (
            <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--destructive)', color: 'var(--destructive-foreground)', opacity: '0.1' }}>
              <p className="font-medium">Registration Closed</p>
              <p className="text-sm">
                Registration for this event has closed. Please contact the event organizer for more information.
              </p>
            </div>
          )}

          {eventFull && registrationOpen && (
            <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--destructive)', color: 'var(--chart-5-foreground)', opacity: '0.1' }}>
              <p className="font-medium">Event Full</p>
              <p className="text-sm">
                This event has reached maximum capacity. You can still register to be added to the waitlist.
              </p>
            </div>
          )}

          {/* Registration Form */}
          {(registrationOpen || eventFull) && (
            <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
              <input type="hidden" {...register("eventId")} />

              {/* Notes Field */}
              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  {...register("notes")}
                  placeholder="Any special requirements, dietary restrictions, or questions for the organizer..."
                  className="mt-1"
                  rows={3}
                />
                {errors.notes && (
                  <p className="mt-1 text-sm text-destructive">{errors.notes.message}</p>
                )}
              </div>

              {/* Terms and Conditions */}
              <div>
                <div className="flex items-start">
                  <input
                    id="terms"
                    type="checkbox"
                    className="mt-1 h-4 w-4 border-input rounded"
                    style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}
                    required
                  />
                  <label htmlFor="terms" className="ml-2 block text-sm" style={{ color: 'var(--muted-foreground)' }}>
                    I agree to the event terms and conditions and understand that my information will be shared with the event organizer.
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : eventFull ? "Join Waitlist" : "Register for Event"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </CardContent>
    </Card>
  );
}