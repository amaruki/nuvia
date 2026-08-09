"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, UserCheck } from "lucide-react";
import type { EventRegistration } from "@/types/event";
import type { EventCheckInInput } from "@/lib/validation/event.validation";
import { formatTime } from "./utils";

interface SelectedRegistrationPanelProps {
  registration: EventRegistration;
  eventId: string;
  onCheckIn: (data: EventCheckInInput) => void;
  onDeselect: () => void;
  isSubmitting: boolean;
}

export function SelectedRegistrationPanel({
  registration,
  eventId,
  onCheckIn,
  onDeselect,
  isSubmitting,
}: SelectedRegistrationPanelProps) {
  return (
    <div className="border-t pt-4">
      <h4 className="font-medium text-foreground/90 mb-3">Selected Registration</h4>
      <div className="bg-background p-4 rounded-lg">
        <div className="flex justify-between items-start mb-3">
          <div>
            <p className="font-medium text-foreground/90">
              {registration.user?.displayName || registration.user?.username || "Attendee"}
            </p>
            <p className="text-sm text-foreground/60">{registration.user?.email}</p>
          </div>
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
        </div>

        {registration.checkedInAt ? (
          <div className="flex items-center text-success bg-chart-2/10 p-2 rounded">
            <CheckCircle className="h-4 w-4 mr-2" />
            <span className="text-sm">
              Already checked in at {formatTime(registration.checkedInAt)}
            </span>
          </div>
        ) : (
          <Button
            onClick={() => {
              const checkInData: EventCheckInInput = {
                eventId,
                registrationId: registration.id,
                checkInMethod: "manual",
              };
              onCheckIn(checkInData);
              onDeselect();
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
  );
}
