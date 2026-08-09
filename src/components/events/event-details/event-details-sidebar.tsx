"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, QrCode, Share2, XCircle } from "lucide-react";
import { Event, EventStatus, RegistrationStatus } from "@/types/event";
import { getRegistrationStatusColor } from "./utils";

interface EventDetailsSidebarProps {
  event: Event;
  isRegistered: boolean;
  registrationStatus?: RegistrationStatus;
  upcoming: boolean;
  today: boolean;
  onRegister?: (eventId: string) => void;
  onCancelRegistration?: (eventId: string) => void;
  onCheckIn?: (eventId: string) => void;
  onShare?: (eventId: string) => void;
  onEdit?: (eventId: string) => void;
}

export function EventDetailsSidebar({
  event,
  isRegistered,
  registrationStatus,
  upcoming,
  today,
  onRegister,
  onCancelRegistration,
  onCheckIn,
  onShare,
  onEdit,
}: EventDetailsSidebarProps) {
  return (
    <div className="space-y-6">
      {/* Registration Card */}
      <Card>
        <CardHeader>
          <CardTitle>Registration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isRegistered && registrationStatus && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Your Status:</span>
              <Badge className={getRegistrationStatusColor(registrationStatus)}>
                {registrationStatus.replace("_", " ")}
              </Badge>
            </div>
          )}

          <div className="space-y-3">
            {upcoming && event.status === EventStatus.PUBLISHED && (
              <>
                {!isRegistered ? (
                  <Button
                    onClick={() => onRegister?.(event.id)}
                    className="w-full"
                    disabled={
                      event.maxAttendees !== undefined &&
                      event.currentAttendees >= event.maxAttendees
                    }
                  >
                    Register for this event
                  </Button>
                ) : (
                  <>
                    {registrationStatus === RegistrationStatus.CONFIRMED && today && (
                      <Button
                        onClick={() => onCheckIn?.(event.id)}
                        variant="outline"
                        className="w-full"
                      >
                        <QrCode className="h-4 w-4 mr-2" />
                        Check In
                      </Button>
                    )}
                    <Button
                      onClick={() => onCancelRegistration?.(event.id)}
                      variant="outline"
                      className="w-full"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancel Registration
                    </Button>
                  </>
                )}
              </>
            )}

            {!upcoming && isRegistered && registrationStatus === RegistrationStatus.CONFIRMED && (
              <div className="flex items-center justify-center p-3 bg-chart-3/10 rounded-lg">
                <CheckCircle className="h-5 w-5 text-chart-3 mr-2" />
                <span className="text-chart-3 text-sm font-medium">You attended this event</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions Card */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={() => onShare?.(event.id)} variant="outline" className="w-full">
            <Share2 className="h-4 w-4 mr-2" />
            Share Event
          </Button>

          {onEdit && (
            <Button onClick={() => onEdit?.(event.id)} variant="outline" className="w-full">
              Edit Event
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
