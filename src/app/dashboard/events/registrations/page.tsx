"use client";

/**
 * Event registrations admin — server-paginated DataTable (UI-09 Tier A).
 * Page/search/status travel to GET /api/v1/events/:id/registrations instead
 * of fetching a silent 100-row cap and filtering in the browser.
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Users } from "lucide-react";
import { useHeader } from "@/contexts/dashboard-context";
import { getEvents } from "@/lib/services/event";
import { formatDate } from "@/lib/utils/event-utils";
import {
  DataTable,
  DataTableFacetedFilter,
  DataTablePagination,
  DataTableSearch,
  useDataTableState,
} from "@/components/data-table";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  cancelEventRegistrationAdmin,
  fetchEventRegistrations,
  REGISTRATION_STATUS_BADGE_STYLES,
  REGISTRATION_STATUS_LABELS,
  type RegistrationDto,
  type RegistrationStatusDb,
} from "../_lib/registrations-api";

/** Statuses for which a cancel action still makes sense. */
const CANCELABLE_STATUSES: Partial<Record<RegistrationStatusDb, true>> = {
  PENDING: true,
  CONFIRMED: true,
  WAITLISTED: true,
};

/**
 * Selector cap, not a table cap: the event dropdown intentionally lists at
 * most this many events. The registrations table itself paginates fully
 * server-side.
 */
const EVENT_SELECTOR_LIMIT = 100;

const STATUS_FACET_OPTIONS = (
  Object.keys(REGISTRATION_STATUS_LABELS) as RegistrationStatusDb[]
).map((status) => ({ value: status, label: REGISTRATION_STATUS_LABELS[status] }));

export default function EventRegistrationsPage() {
  const { setHeader, clearHeader } = useHeader();
  const queryClient = useQueryClient();

  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [actionError, setActionError] = useState<string | null>(null);
  // Admin cancel confirmation (AlertDialog+reason pattern from users/roles).
  const [cancelTarget, setCancelTarget] = useState<RegistrationDto | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  const { state, setGlobalFilter, setColumnFilters, setPage, setPageSize } = useDataTableState({
    defaultPageSize: 20,
    filterParams: { status: "status" },
  });

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
    queryFn: () => getEvents(undefined, 1, EVENT_SELECTOR_LIMIT),
  });
  const events = eventsData?.events ?? [];

  useEffect(() => {
    if (!selectedEventId && events.length > 0) {
      setSelectedEventId(events[0].id);
    }
  }, [events, selectedEventId]);

  const selectedEvent = events.find((eventItem) => eventItem.id === selectedEventId);

  const statusFilter = useMemo<RegistrationStatusDb[]>(
    () =>
      ((state.columnFilters.find((filter) => filter.id === "status")?.value as string[]) ??
        []) as RegistrationStatusDb[],
    [state.columnFilters],
  );

  const registrationsQuery = useQuery({
    queryKey: [
      "event-registrations",
      selectedEventId,
      state.page,
      state.pageSize,
      statusFilter,
      state.globalFilter,
    ],
    queryFn: () =>
      fetchEventRegistrations(selectedEventId, {
        status: statusFilter.length > 0 ? statusFilter : undefined,
        search: state.globalFilter.trim() || undefined,
        page: state.page,
        limit: state.pageSize,
      }),
    enabled: Boolean(selectedEventId),
    placeholderData: keepPreviousData,
  });

  const registrations = registrationsQuery.data;
  const totalPages = Math.max(1, registrations?.totalPages ?? 1);
  const safePage = Math.min(state.page, totalPages);

  // A page that outlives its result set (rows canceled away) snaps back.
  useEffect(() => {
    if (registrations && state.page > totalPages) {
      setPage(totalPages);
    }
  }, [registrations, state.page, totalPages, setPage]);

  const cancelMutation = useMutation({
    mutationFn: ({ registrationId, reason }: { registrationId: string; reason?: string }) =>
      cancelEventRegistrationAdmin(selectedEventId, registrationId, reason),
    onSuccess: () => {
      setActionError(null);
      setCancelTarget(null);
      setCancelReason("");
      queryClient.invalidateQueries({ queryKey: ["event-registrations", selectedEventId] });
      queryClient.invalidateQueries({ queryKey: ["admin-events-for-registrations"] });
    },
    onError: (error) => {
      setActionError(error instanceof Error ? error.message : "Failed to cancel registration");
    },
  });

  const columns = useMemo<ColumnDef<RegistrationDto>[]>(
    () => [
      {
        id: "attendee",
        accessorFn: (row) => row.user?.name ?? row.user?.username ?? "",
        header: "Attendee",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="text-base font-semibold">
              {row.original.user?.name ?? row.original.user?.username ?? "Unknown user"}
            </span>
            <span className="text-xs text-muted-foreground">{row.original.user?.email}</span>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        enableSorting: false,
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={REGISTRATION_STATUS_BADGE_STYLES[row.original.status]}
          >
            {REGISTRATION_STATUS_LABELS[row.original.status]}
          </Badge>
        ),
      },
      {
        id: "registeredAt",
        accessorFn: (row) => row.registeredAt,
        header: "Registered",
        enableSorting: false,
        cell: ({ row }) => formatDate(new Date(row.original.registeredAt)),
      },
      {
        accessorKey: "notes",
        header: "Notes",
        enableSorting: false,
        cell: ({ row }) =>
          row.original.notes ? (
            <span
              className="text-sm text-muted-foreground truncate max-w-[220px] inline-block align-middle"
              title={row.original.notes}
            >
              {row.original.notes}
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
          ),
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) =>
          CANCELABLE_STATUSES[row.original.status] ? (
            <div className="text-right">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCancelTarget(row.original);
                  setCancelReason("");
                }}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
          ),
      },
    ],
    [],
  );

  // Facet counts reflect the loaded page in manual mode (the API does not
  // return cross-status aggregates).
  const facetCounts = useCallback(
    (columnId: string) => {
      const counts = new Map<string, number>();
      if (columnId !== "status") return counts;
      for (const registration of registrations?.items ?? []) {
        counts.set(registration.status, (counts.get(registration.status) ?? 0) + 1);
      }
      return counts;
    },
    [registrations],
  );

  return (
    <div className="space-y-6 animate-fadeInUp">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Users className="h-5 w-5 text-muted-foreground shrink-0" />
          <Select
            value={selectedEventId}
            onValueChange={(eventId) => {
              setSelectedEventId(eventId);
              setPage(1);
            }}
          >
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

        {selectedEvent && (
          <div className="text-sm text-muted-foreground">
            {registrations?.total ?? 0} registration
            {(registrations?.total ?? 0) === 1 ? "" : "s"} for{" "}
            <span className="font-medium text-foreground">{selectedEvent.title}</span>
          </div>
        )}
      </div>

      {actionError && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {actionError}
        </div>
      )}

      <DataTable
        columns={columns}
        data={registrations?.items ?? []}
        loading={registrationsQuery.isPending}
        error={
          registrationsQuery.error
            ? registrationsQuery.error instanceof Error
              ? registrationsQuery.error.message
              : "Failed to load registrations."
            : null
        }
        onRetry={() => void registrationsQuery.refetch()}
        caption={`Registrations for ${selectedEvent?.title ?? "the selected event"}`}
        manualSorting
        manualFiltering
        globalFilter={state.globalFilter}
        onGlobalFilterChange={(updater) =>
          setGlobalFilter(typeof updater === "function" ? updater(state.globalFilter) : updater)
        }
        columnFilters={state.columnFilters}
        onColumnFiltersChange={(updater) =>
          setColumnFilters(typeof updater === "function" ? updater(state.columnFilters) : updater)
        }
        getFacetedUniqueValues={facetCounts}
        getRowId={(row) => row.id}
        emptyTitle={selectedEventId ? "No registrations found for this event" : "Select an event"}
        emptyDescription={
          selectedEventId
            ? "Try adjusting the search or status filter."
            : "Pick an event above to view its registrations."
        }
        toolbar={(table) => (
          <>
            <DataTableSearch
              value={state.globalFilter}
              onValueChange={setGlobalFilter}
              placeholder="Search attendees..."
              id="registrations-search"
            />
            <DataTableFacetedFilter
              column={table.getColumn("status")}
              title="Status"
              options={STATUS_FACET_OPTIONS}
            />
          </>
        )}
        pagination={
          <DataTablePagination
            page={safePage}
            pageCount={totalPages}
            total={registrations?.total ?? 0}
            pageSize={state.pageSize}
            loading={registrationsQuery.isFetching}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        }
      />

      {/* Cancel confirmation — mirrors the users/roles AlertDialog+reason flow. */}
      <AlertDialog
        open={cancelTarget !== null}
        onOpenChange={(open) => {
          if (!open && !cancelMutation.isPending) {
            setCancelTarget(null);
            setCancelReason("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this registration?</AlertDialogTitle>
            <AlertDialogDescription>
              {cancelTarget
                ? `${
                    cancelTarget.user?.name ?? cancelTarget.user?.username ?? "This attendee"
                  } will lose their${
                    cancelTarget.status === "WAITLISTED" ? " waitlist spot" : " seat"
                  } for ${selectedEvent?.title ?? "this event"}. A waitlisted attendee may be promoted into the freed spot. This action is logged.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="cancelReason">Reason (optional)</Label>
            <Textarea
              id="cancelReason"
              placeholder="Why is this registration being canceled?"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
              disabled={cancelMutation.isPending}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelMutation.isPending}>Keep it</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={cancelMutation.isPending || !cancelTarget}
              onClick={() =>
                cancelTarget &&
                cancelMutation.mutate({
                  registrationId: cancelTarget.id,
                  reason: cancelReason.trim() || undefined,
                })
              }
            >
              {cancelMutation.isPending ? "Canceling..." : "Cancel registration"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
