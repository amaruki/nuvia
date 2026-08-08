"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { QrCode, UserCheck, AlertCircle, CheckCircle, Search } from "lucide-react";
import { Event, EventRegistration } from "@/types/event.types";
import type { EventCheckIn } from "@/types/event.types";
import { eventCheckInSchema, type EventCheckInInput } from "@/lib/validation/event.validation";

interface EventCheckInProps {
  event: Event;
  onCheckIn: (data: EventCheckInInput) => void;
  onSearchRegistration?: (searchTerm: string) => void;
  isSubmitting?: boolean;
  searchResults?: EventRegistration[];
  className?: string;
}

const checkInFormSchema = z.object({
  verificationCode: z.string().min(1, "Verification code is required"),
});

type CheckInFormInput = z.infer<typeof checkInFormSchema>;

export function EventCheckIn({
  event,
  onCheckIn,
  onSearchRegistration,
  isSubmitting = false,
  searchResults = [],
  className = "",
}: EventCheckInProps) {
  const [selectedRegistration, setSelectedRegistration] = React.useState<EventRegistration | null>(
    null,
  );
  const [searchTerm, setSearchTerm] = React.useState("");
  const [checkInMethod, setCheckInMethod] = React.useState<"qr" | "manual">("qr");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CheckInFormInput>({
    resolver: zodResolver(checkInFormSchema),
  });

  const onFormSubmit = (data: CheckInFormInput) => {
    const checkInData: EventCheckInInput = {
      eventId: event.id,
      checkInMethod,
      verificationCode: data.verificationCode,
    };
    onCheckIn(checkInData);
    reset();
  };

  const handleSearch = () => {
    if (searchTerm.trim() && onSearchRegistration) {
      onSearchRegistration(searchTerm.trim());
    }
  };

  const handleRegistrationSelect = (registration: EventRegistration) => {
    setSelectedRegistration(registration);
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

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* QR Code Check-in */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <QrCode className="h-5 w-5 mr-2" />
              QR Code Check-in
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="bg-muted border-2 border-dashed border-border rounded-lg p-8 mb-4">
                <QrCode className="h-16 w-16 mx-auto text-foreground/40" />
                <p className="mt-2 text-sm text-foreground/50">Scan QR codes from event tickets</p>
              </div>
              <p className="text-sm text-foreground/60">
                Attendees can show their QR code in the event confirmation email or in their event
                registration.
              </p>
            </div>

            <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="verificationCode">Verification Code</Label>
                <Input
                  id="verificationCode"
                  {...register("verificationCode")}
                  placeholder="Enter verification code from QR"
                  className="mt-1"
                />
                {errors.verificationCode && (
                  <p className="mt-1 text-sm text-destructive">{errors.verificationCode.message}</p>
                )}
              </div>

              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant={checkInMethod === "qr" ? "default" : "outline"}
                  onClick={() => setCheckInMethod("qr")}
                  className="flex-1"
                >
                  <QrCode className="h-4 w-4 mr-2" />
                  QR Code
                </Button>
                <Button
                  type="button"
                  variant={checkInMethod === "manual" ? "default" : "outline"}
                  onClick={() => setCheckInMethod("manual")}
                  className="flex-1"
                >
                  <UserCheck className="h-4 w-4 mr-2" />
                  Manual
                </Button>
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Checking in..." : "Check In Attendee"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Manual Search Check-in */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="h-5 w-5 mr-2" />
              Manual Check-in
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex space-x-2">
              <Input
                placeholder="Search by name, email, or registration ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1"
              />
              <Button onClick={handleSearch} disabled={!searchTerm.trim()}>
                Search
              </Button>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                <p className="text-sm text-foreground/60">
                  Found {searchResults.length} registration{searchResults.length !== 1 ? "s" : ""}
                </p>
                {searchResults.map((registration) => (
                  <div
                    key={registration.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedRegistration?.id === registration.id
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-border"
                    }`}
                    role="button"
                    tabIndex={0}
                    aria-label={`Select registration for ${registration.user?.displayName || registration.user?.username || registration.user?.email || "attendee"}`}
                    onClick={() => handleRegistrationSelect(registration)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleRegistrationSelect(registration);
                      }
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-foreground/90">
                          {registration.user?.displayName ||
                            registration.user?.username ||
                            "Attendee"}
                        </p>
                        <p className="text-sm text-foreground/60">{registration.user?.email}</p>
                        <div className="flex items-center mt-1">
                          <Badge
                            className={
                              registration.status === "confirmed"
                                ? "bg-chart-2/20 text-success"
                                : registration.status === "pending"
                                  ? "bg-warning/20 text-warning"
                                  : "bg-muted text-muted-foreground"
                            }
                          >
                            {registration.status}
                          </Badge>
                          {registration.checkedInAt && (
                            <Badge className="bg-info/20 text-info ml-2">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Checked In
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-foreground/50">
                          Registered: {formatDate(registration.registeredAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Selected Registration */}
            {selectedRegistration && (
              <div className="border-t pt-4">
                <h4 className="font-medium text-foreground/90 mb-3">Selected Registration</h4>
                <div className="bg-background p-4 rounded-lg">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-medium text-foreground/90">
                        {selectedRegistration.user?.displayName ||
                          selectedRegistration.user?.username ||
                          "Attendee"}
                      </p>
                      <p className="text-sm text-foreground/60">
                        {selectedRegistration.user?.email}
                      </p>
                    </div>
                    <Badge
                      className={
                        selectedRegistration.status === "confirmed"
                          ? "bg-chart-2/20 text-success"
                          : selectedRegistration.status === "pending"
                            ? "bg-warning/20 text-warning"
                            : "bg-muted text-muted-foreground"
                      }
                    >
                      {selectedRegistration.status}
                    </Badge>
                  </div>

                  {selectedRegistration.checkedInAt ? (
                    <div className="flex items-center text-success bg-chart-2/10 p-2 rounded">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      <span className="text-sm">
                        Already checked in at {formatTime(selectedRegistration.checkedInAt)}
                      </span>
                    </div>
                  ) : (
                    <Button
                      onClick={() => {
                        const checkInData: EventCheckInInput = {
                          eventId: event.id,
                          registrationId: selectedRegistration.id,
                          checkInMethod: "manual",
                        };
                        onCheckIn(checkInData);
                        setSelectedRegistration(null);
                      }}
                      className="w-full"
                      disabled={isSubmitting}
                    >
                      <UserCheck className="h-4 w-4 mr-2" />
                      {isSubmitting ? "Checking in..." : "Check In Attendee"}
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Event Information */}
            <div className="bg-info/10 border border-info/30 text-info p-4 rounded-lg">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-blue-400 mr-2 flex-shrink-0" />
                <div>
                  <p className="font-medium">Event Information</p>
                  <p className="text-sm mt-1">{event.title}</p>
                  <p className="text-sm">
                    {formatDate(event.startDate)} at {formatTime(event.startDate)}
                  </p>
                  <p className="text-sm">{event.location}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
