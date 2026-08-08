"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Users } from "lucide-react";
import { useHeader } from "@/contexts/dashboard-context";
import { getEvents } from "@/lib/services/event.service";
import { formatDate } from "@/lib/utils/event-utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  cancelEventRegistrationAdmin,
  fetchEventRegistrations,
  REGISTRATION_STATUS_BADGE_STYLES,
  REGISTRATION_STATUS_LABELS,
  type RegistrationStatusDb,
} from "../_lib/registrations-api";

/** Statuses for which a cancel action still makes sense. */
const CANCELABLE_STATUSES: Partial<Record<RegistrationStatusDb, true>> = {
  PENDING: true,
  CONFIRMED: true,
  WAITLISTED: true,
};

export default function EventRegistrationsPage() {
  const { setHeader, clearHeader } = useHeader();
  const queryClient = useQueryClient();

  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    setHeader({
      title: "Event Registrations",
      description: "Review and manage attendee registrations across events",
    });
    return () => {
      clearHeader();
    };
  }, [setHeader, clearHeader]);

  const { data: eventsData } = useQuery({
    queryKey: ["admin-events-for-registrations"],
    queryFn: () => getEvents(undefined, 1, 100),
  });
  const events = eventsData?.events ?? [];

  useEffect(() => {
    if (!selectedEventId && events.length > 0) {
      setSelectedEventId(events[0].id);
    }
  }, [events, selectedEventId]);

  const selectedEvent = events.find((eventItem) => eventItem.id === selectedEventId);

  const { data: registrationsData, isLoading } = useQuery({
    queryKey: ["event-registrations", selectedEventId],
    queryFn: () => fetchEventRegistrations(selectedEventId, { limit: 100 }),
    enabled: Boolean(selectedEventId),
  });

  const cancelMutation = useMutation({
    mutationFn: (registrationId: string) =>
      cancelEventRegistrationAdmin(selectedEventId, registrationId),
    onSuccess: () => {
      setActionError(null);
      queryClient.invalidateQueries({ queryKey: ["event-registrations", selectedEventId] });
      queryClient.invalidateQueries({ queryKey: ["admin-events-for-registrations"] });
    },
    onError: (error) => {
      setActionError(error instanceof Error ? error.message : "Failed to cancel registration");
    },
  });

  const registrations = useMemo(() => {
    const items = registrationsData?.items ?? [];
    const term = searchQuery.trim().toLowerCase();
    return items.filter((registration) => {
      if (statusFilter !== "all" && registration.status !== statusFilter) return false;
      if (!term) return true;
      return (
        registration.user?.name.toLowerCase().includes(term) ||
        registration.user?.email.toLowerCase().includes(term) ||
        registration.user?.username.toLowerCase().includes(term)
      );
    });
  }, [registrationsData, searchQuery, statusFilter]);

  return (
    <div className="space-y-6 animate-fadeInUp">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Users className="h-5 w-5 text-muted-foreground shrink-0" />
          <Select value={selectedEventId} onValueChange={setSelectedEventId}>
            <SelectTrigger className="w-full md:w-[320px]">
              <SelectValue placeholder="Select an event" />
            </SelectTrigger>
            <SelectContent>
              {events.map((eventItem) => (
                <SelectItem key={eventItem.id} value={eventItem.id}>
                  {eventItem.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search attendees..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {(Object.keys(REGISTRATION_STATUS_LABELS) as RegistrationStatusDb[]).map((status) => (
                <SelectItem key={status} value={status}>
                  {REGISTRATION_STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedEvent && (
        <div className="text-sm text-muted-foreground">
          {registrationsData?.total ?? 0} registration
          {(registrationsData?.total ?? 0) === 1 ? "" : "s"} for{" "}
          <span className="font-medium text-foreground">{selectedEvent.title}</span>
        </div>
      )}

      {actionError && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {actionError}
        </div>
      )}

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Attendee</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Registered</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  Loading registrations...
                </TableCell>
              </TableRow>
            )}
            {!isLoading &&
              registrations.map((registration) => (
                <TableRow key={registration.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span className="text-base font-semibold">
                        {registration.user?.name ?? registration.user?.username ?? "Unknown user"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {registration.user?.email}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={REGISTRATION_STATUS_BADGE_STYLES[registration.status]}
                    >
                      {REGISTRATION_STATUS_LABELS[registration.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(new Date(registration.registeredAt))}</TableCell>
                  <TableCell>
                    {registration.notes ? (
                      <span
                        className="text-sm text-muted-foreground truncate max-w-[220px] inline-block align-middle"
                        title={registration.notes}
                      >
                        {registration.notes}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {CANCELABLE_STATUSES[registration.status] ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={cancelMutation.isPending}
                        onClick={() => cancelMutation.mutate(registration.id)}
                      >
                        Cancel
                      </Button>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            {!isLoading && registrations.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  {selectedEventId
                    ? "No registrations found for this event."
                    : "Select an event to view registrations."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
