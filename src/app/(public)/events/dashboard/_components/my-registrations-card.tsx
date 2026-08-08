"use client";

/**
 * Card listing the current user's recent event registrations with status
 * and check-in badges.
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, Calendar, Clock, Users } from "lucide-react";
import type { Event, EventRegistration } from "@/types/event";
import { formatDate, formatTime } from "./date-utils";

interface MyRegistrationsCardProps {
  registrations: { event: Event; registration: EventRegistration }[];
}

export function MyRegistrationsCard({ registrations }: MyRegistrationsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>My Registrations</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => (window.location.href = "/events/certificates")}
          >
            Certificates
            <Award className="h-4 w-4 ml-1" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {registrations.length === 0 ? (
          <div className="text-center py-8 text-foreground/50">
            <Users className="h-12 w-12 mx-auto mb-2 text-foreground/40" />
            <p>No event registrations</p>
          </div>
        ) : (
          <div className="space-y-4">
            {registrations.slice(0, 3).map(({ event, registration }) => (
              <div
                key={registration.id}
                className="flex items-start p-3 border rounded-lg hover:bg-background transition-colors"
              >
                <div className="flex-1">
                  <h3 className="font-medium text-foreground/90">{event.title}</h3>
                  <div className="flex items-center text-sm text-foreground/50 mt-1">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>{formatDate(event.startDate)}</span>
                  </div>
                  <div className="flex items-center text-sm text-foreground/50 mt-1">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>{formatTime(event.startDate)}</span>
                  </div>
                </div>
                <div className="ml-2">
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
                    <Badge className="bg-info/20 text-info mt-1">Checked In</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
