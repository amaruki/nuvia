"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ScanLine, Users } from "lucide-react";
import { useHeader } from "@/contexts/dashboard-context";
import { getEvents } from "@/lib/services/event";
import { formatDate, formatTime } from "@/lib/utils/event-utils";
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
  checkInEventRegistration,
  fetchEventRegistrations,
  REGISTRATION_STATUS_BADGE_STYLES,
  REGISTRATION_STATUS_LABELS,
} from "../_lib/registrations-api";

/** Only confirmed attendees are actionable; attended rows show history. */
const CHECKIN_FILTERS: Array<{ value: string; label: string }> = [
  { value: "CONFIRMED", label: "Awaiting check-in" },
  { value: "ATTENDED", label: "Checked in" },
  { value: "all", label: "All statuses" },
];

export default function EventCheckInPage() {
  const { setHeader, clearHeader } = useHeader();
  const queryClient = useQueryClient();

  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("CONFIRMED");
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    setHeader({
      title: "Event Check-in",
      description: "Check confirmed attendees in as they arrive",
    });
    return () => {
      clearHeader();
    };
  }, [setHeader, clearHeader]);

  const { data: eventsData } = useQuery({
    queryKey: ["admin-events-for-checkin"],
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
    queryKey: ["event-checkin-registrations", selectedEventId],
    queryFn: () => fetchEventRegistrations(selectedEventId, { limit: 100 }),
    enabled: Boolean(selectedEventId),
  });

  const checkInMutation = useMutation({
    mutationFn: (registrationId: string) =>
      checkInEventRegistration(selectedEventId, registrationId),
    onSuccess: () => {
      setActionError(null);
      queryClient.invalidateQueries({ queryKey: ["event-checkin-registrations", selectedEventId] });
      queryClient.invalidateQueries({ queryKey: ["admin-events-for-checkin"] });
    },
    onError: (error) => {
      setActionError(error instanceof Error ? error.message : "Failed to check in attendee");
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

  const stats = useMemo(() => {
    const items = registrationsData?.items ?? [];
    return {
      confirmed: items.filter((registration) => registration.status === "CONFIRMED").length,
      attended: items.filter((registration) => registration.status === "ATTENDED").length,
      total: registrationsData?.total ?? items.length,
    };
  }, [registrationsData]);

  return (
    <div className="space-y-6 animate-fadeInUp">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <ScanLine className="h-5 w-5 text-muted-foreground shrink-0" />
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
            <Users className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search attendees..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              {CHECKIN_FILTERS.map((filter) => (
                <SelectItem key={filter.value} value={filter.value}>
                  {filter.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedEvent && (
        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
          <span>
            <span className="font-medium text-foreground">{stats.confirmed}</span> awaiting check-in
          </span>
          <span aria-hidden>·</span>
          <span>
            <span className="font-medium text-foreground">{stats.attended}</span> checked in
          </span>
          <span aria-hidden>·</span>
          <span>
            <span className="font-medium text-foreground">{stats.total}</span> total registrations
          </span>
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
              <TableHead>Checked in at</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  Loading attendees...
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
                  <TableCell>
                    {registration.checkedInAt ? (
                      `${formatDate(new Date(registration.checkedInAt))} ${formatTime(new Date(registration.checkedInAt))}`
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {registration.status === "CONFIRMED" ? (
                      <Button
                        size="sm"
                        disabled={checkInMutation.isPending}
                        onClick={() => checkInMutation.mutate(registration.id)}
                      >
                        Check In
                      </Button>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            {!isLoading && registrations.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  {selectedEventId
                    ? "No attendees match the current filter."
                    : "Select an event to start checking in attendees."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
