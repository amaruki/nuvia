/**
 * UI-31 — My event registrations widget (member home).
 *
 * Lists the caller's own event registrations with the event name, start
 * date, and status, each linking to the public event page. Cancellation is
 * offered only for statuses where a member-facing cancel exists
 * (PENDING / CONFIRMED / WAITLISTED) and calls the real
 * `cancelEventRegistration` service, then refreshes the server-rendered
 * list so the status reflects the change.
 *
 * Client component because cancellation is an interactive mutation.
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type { MyEventRegistrationItem } from "@/lib/services/member/home";
import { REGISTRATION_STATUS_LABELS, isRegistrationCancelable } from "./member-home-states";
import { formatDate } from "@/lib/utils/date-utils";
import { cancelEventRegistration } from "@/lib/services/event";

interface MemberRegistrationsWidgetProps {
  registrations: MyEventRegistrationItem[];
}

export function MemberRegistrationsWidget({ registrations }: MemberRegistrationsWidgetProps) {
  const router = useRouter();
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCancel(eventId: string, registrationId: string): Promise<void> {
    setCancelingId(registrationId);
    setError(null);
    try {
      await cancelEventRegistration(eventId);
      router.refresh();
    } catch (cancelError) {
      setError(
        cancelError instanceof Error ? cancelError.message : "Could not cancel registration",
      );
    } finally {
      setCancelingId(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-muted-foreground" aria-hidden />
          My event registrations
        </CardTitle>
        <CardDescription>Events you have signed up for</CardDescription>
      </CardHeader>
      <CardContent>
        {registrations.length === 0 ? (
          <EmptyState
            title="No registrations yet"
            description="When you sign up for an event it will appear here."
            icon={<CalendarDays className="h-8 w-8 text-muted-foreground" />}
          />
        ) : (
          <ul className="space-y-3">
            {registrations.map((registration) => {
              const cancelable = isRegistrationCancelable(registration.status);
              const isCanceling = cancelingId === registration.registrationId;
              return (
                <li
                  key={registration.registrationId}
                  className="flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1">
                    <Link
                      href={`/events/${registration.eventId}`}
                      className="font-medium underline-offset-4 hover:underline"
                    >
                      {registration.eventTitle}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(registration.eventStartTime, "MMM d, yyyy h:mm a")}
                    </p>
                    <Badge variant="outline">
                      {REGISTRATION_STATUS_LABELS[registration.status]}
                    </Badge>
                  </div>
                  {cancelable ? (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isCanceling}
                      onClick={() =>
                        handleCancel(registration.eventId, registration.registrationId)
                      }
                    >
                      {isCanceling ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                          Canceling…
                        </>
                      ) : (
                        "Cancel registration"
                      )}
                    </Button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
        {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
      </CardContent>
    </Card>
  );
}
