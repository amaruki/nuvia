"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { QrCode, Download, ExternalLink, XCircle, CheckCircle, Clock } from "lucide-react";
import { Event, EventRegistration, RegistrationStatus } from "@/types/event";

interface EventRegistrationStatusProps {
  event: Event;
  registration: EventRegistration;
  onCancelRegistration?: (eventId: string) => void;
  onCheckIn?: (eventId: string) => void;
  onViewCertificate?: (certificateUrl: string) => void;
  className?: string;
}

const getRegistrationStatusColor = (status: RegistrationStatus): string => {
  switch (status) {
    case RegistrationStatus.PENDING:
      return "bg-warning/20 text-warning";
    case RegistrationStatus.CONFIRMED:
      return "bg-chart-2/20 text-success";
    case RegistrationStatus.CANCELLED:
      return "bg-destructive/20 text-destructive";
    case RegistrationStatus.WAITLISTED:
      return "bg-info/20 text-info";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
};

const formatTime = (date: Date): string => {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
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

const isEventUpcoming = (startDate: Date): boolean => {
  return new Date(startDate) > new Date();
};

const isEventPast = (endDate: Date): boolean => {
  return new Date(endDate) < new Date();
};

export function EventRegistrationStatus({
  event,
  registration,
  onCancelRegistration,
  onCheckIn,
  onViewCertificate,
  className = "",
}: EventRegistrationStatusProps) {
  const today = isEventToday(event.startDate);
  const upcoming = isEventUpcoming(event.startDate);
  const past = isEventPast(event.endDate);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Registration Status</span>
          <Badge className={getRegistrationStatusColor(registration.status)}>
            {registration.status.replace("_", " ")}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Event Information */}
        <div className="bg-background p-4 rounded-lg">
          <h3 className="font-medium mb-2" style={{ color: "var(--foreground)" }}>
            Event Details
          </h3>
          <div className="space-y-2 text-sm" style={{ color: "var(--muted-foreground)" }}>
            <p>
              <span className="font-medium">Event:</span> {event.title}
            </p>
            <p>
              <span className="font-medium">Date:</span> {formatDate(event.startDate)}
            </p>
            <p>
              <span className="font-medium">Time:</span> {formatTime(event.startDate)} -{" "}
              {formatTime(event.endDate)}
            </p>
            <p>
              <span className="font-medium">Location:</span> {event.location}
            </p>
            <p>
              <span className="font-medium">Registered on:</span>{" "}
              {formatDate(registration.registeredAt)}
            </p>
          </div>
        </div>

        {/* Status-specific Messages */}
        {registration.status === RegistrationStatus.PENDING && (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertTitle>Registration Pending</AlertTitle>
            <AlertDescription>
              Your registration is being reviewed. You will receive a confirmation email once your
              registration is approved.
            </AlertDescription>
          </Alert>
        )}

        {registration.status === RegistrationStatus.WAITLISTED && (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertTitle>Waitlisted</AlertTitle>
            <AlertDescription>
              This event is currently full. You have been added to the waitlist and will be notified
              if a spot becomes available.
            </AlertDescription>
          </Alert>
        )}

        {registration.status === RegistrationStatus.CONFIRMED && upcoming && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Registration Confirmed</AlertTitle>
            <AlertDescription>
              You are successfully registered for this event. Please check your email for
              confirmation details.
            </AlertDescription>
          </Alert>
        )}

        {registration.status === RegistrationStatus.CANCELLED && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Registration Cancelled</AlertTitle>
            <AlertDescription>
              Your registration for this event has been cancelled.
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {registration.status === RegistrationStatus.CONFIRMED && upcoming && (
            <>
              {today && (
                <Button
                  onClick={() => onCheckIn?.(event.id)}
                  className="w-full"
                  disabled={!!registration.checkedInAt}
                >
                  <QrCode className="h-4 w-4 mr-2" />
                  {registration.checkedInAt ? "Already Checked In" : "Check In Now"}
                </Button>
              )}

              {!today && (
                <div
                  className="text-center text-sm p-3 rounded-lg"
                  style={{ color: "var(--muted-foreground)", backgroundColor: "var(--background)" }}
                >
                  Check-in will be available on the day of the event
                </div>
              )}
            </>
          )}

          {registration.status === RegistrationStatus.CONFIRMED &&
            past &&
            registration.certificateIssued &&
            registration.certificateUrl && (
              <Button
                onClick={() => onViewCertificate?.(registration.certificateUrl!)}
                variant="outline"
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                View Certificate
              </Button>
            )}

          {registration.status === RegistrationStatus.CONFIRMED && upcoming && (
            <Button
              onClick={() => onCancelRegistration?.(event.id)}
              variant="outline"
              className="w-full"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Cancel Registration
            </Button>
          )}

          {registration.status === RegistrationStatus.WAITLISTED && (
            <Button
              onClick={() => onCancelRegistration?.(event.id)}
              variant="outline"
              className="w-full"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Remove from Waitlist
            </Button>
          )}
        </div>

        {/* Check-in Information */}
        {registration.checkedInAt && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Checked In</AlertTitle>
            <AlertDescription>
              You checked in at {formatTime(registration.checkedInAt)} on{" "}
              {formatDate(registration.checkedInAt)}.
              {registration.checkInMethod && <p>Check-in method: {registration.checkInMethod}</p>}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
