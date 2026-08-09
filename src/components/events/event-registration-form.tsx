"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Event } from "@/types/event";
import {
  eventRegistrationSchema,
  type EventRegistrationInput,
} from "@/lib/validation/event.validation";
import {
  formatDateLong,
  isRegistrationOpen,
  isEventFull,
  formatEventTimeRange,
  getRegistrationFormState,
} from "@/lib/utils/event-utils";

export const registrationFormSchema = eventRegistrationSchema.extend({
  terms: z.boolean().refine((val) => val === true, "You must agree to the terms and conditions"),
});

type RegistrationFormData = z.infer<typeof registrationFormSchema>;

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
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationFormSchema),
    defaultValues: {
      eventId: event.id,
      notes: "",
      terms: false,
    },
  });

  const onFormSubmit = (data: RegistrationFormData) => {
    onSubmit(data);
  };

  const registrationOpen = isRegistrationOpen(event.startDate, event.registrationDeadline);
  const eventFull = isEventFull(event.currentAttendees, event.maxAttendees);
  const formState = getRegistrationFormState(registrationOpen, eventFull);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Register for {event.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Event Information */}
          <div className="bg-background p-4 rounded-lg">
            <h3 className="font-medium mb-2 text-foreground">Event Details</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                <span className="font-medium">Date:</span> {formatDateLong(event.startDate)}
              </p>
              <p>
                <span className="font-medium">Time:</span>{" "}
                {formatEventTimeRange(event.startDate, event.endDate)}
              </p>
              <p>
                <span className="font-medium">Location:</span> {event.location}
              </p>
              {event.maxAttendees && (
                <p>
                  <span className="font-medium">Availability:</span> {event.currentAttendees} of{" "}
                  {event.maxAttendees} spots filled
                </p>
              )}
            </div>
          </div>

          {/* Registration Status Messages */}
          {formState === "closed" && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Registration Closed</AlertTitle>
              <AlertDescription>
                Registration for this event has closed. Please contact the event organizer for more
                information.
              </AlertDescription>
            </Alert>
          )}

          {formState === "full" && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Event Full</AlertTitle>
              <AlertDescription>
                This event has reached maximum capacity. You can still register to be added to the
                waitlist.
              </AlertDescription>
            </Alert>
          )}

          {/* Registration Form */}
          {formState !== "closed" && (
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
              <div className="space-y-1">
                <div className="flex items-start space-x-2">
                  <Controller
                    name="terms"
                    control={control}
                    render={({ field }) => (
                      <Checkbox id="terms" checked={field.value} onCheckedChange={field.onChange} />
                    )}
                  />
                  <Label htmlFor="terms" className="text-sm font-normal leading-relaxed">
                    I agree to the event terms and conditions and understand that my information
                    will be shared with the event organizer.
                  </Label>
                </div>
                {errors.terms && <p className="text-sm text-destructive">{errors.terms.message}</p>}
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting
                    ? "Submitting..."
                    : eventFull
                      ? "Join Waitlist"
                      : "Register for Event"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
