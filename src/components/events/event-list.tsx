"use client";

import * as React from "react";
import { EventCard } from "./event-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { AsyncContent } from "@/components/ui/async-content";
import { Calendar, Plus, Filter, SortAsc, SortDesc } from "lucide-react";
import { Event } from "@/types/event.types";
import { EventFilter as EventFilterType } from "@/types/event.types";
import { formatEventStatus, formatEventType } from "@/lib/utils/event-utils";
import { useEventFilters, useEvents } from "@/lib/hooks/use-events";
import { EventFilter } from "@/components/events/event-filter";

interface EventListProps {
  events: Event[];
  isLoading?: boolean;
  error?: string;
  filter?: EventFilterType;
  onFilterChange?: (filter: EventFilterType) => void;
  onSortChange?: (sort: "asc" | "desc") => void;
  onCreateEvent?: () => void;
  onRegister?: (eventId: string) => void;
  onViewDetails?: (eventId: string) => void;
  showCreateButton?: boolean;
  showRegistrationStatus?: boolean;
  className?: string;
}

export function EventList({
  filter,
  onFilterChange,
  onSortChange,
  onCreateEvent,
  onRegister,
  onViewDetails,
  showCreateButton = false,
  showRegistrationStatus = false,
  className = "",
}: EventListProps) {
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("asc");
  const [showFilters, setShowFilters] = React.useState(false);
  const { filters, updateFilter, clearFilters, hasActiveFilters } =
    useEventFilters();

  const { events, isLoading, error, refetch } = useEvents(filters);

  const handleFilterChange = (newFilter: EventFilterType) => {
    updateFilter("searchQuery", newFilter.searchQuery);
    updateFilter("status", newFilter.status);
    updateFilter("eventType", newFilter.eventType);
    updateFilter("startDate", newFilter.startDate);
    updateFilter("endDate", newFilter.endDate);
    updateFilter("organizerId", newFilter.organizerId);
    updateFilter("tags", newFilter.tags);
    updateFilter("isVirtual", newFilter.isVirtual);
    updateFilter("isInPerson", newFilter.isInPerson);
  };
  const handleSortChange = (order: "asc" | "desc") => {
    setSortOrder(order);
    onSortChange?.(order);
  };

  const handleClearFilters = () => {
    clearFilters();
  };

  // Sort events by start date
  const sortedEvents = React.useMemo(() => {
    const sorted = [...events];
    sorted.sort((a, b) => {
      const dateA = new Date(a.startDate).getTime();
      const dateB = new Date(b.startDate).getTime();
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });
    return sorted;
  }, [events, sortOrder]);

  if (events.length === 0) {
    return (
      <div className={`py-12 ${className}`}>
        <EmptyState
          title="No events found"
          description={
            filter
              ? "Try adjusting your filters to see more events."
              : "There are no events at the moment. Check back later or create a new event."
          }
          icon={
            <Calendar
              className="h-12 w-12"
              style={{ color: "var(--muted-foreground)", opacity: "0.4" }}
            />
          }
        />
        {showCreateButton && onCreateEvent && (
          <div className="flex justify-center mt-4">
            <Button onClick={onCreateEvent}>
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`space-y-6 ${className}`}
      role="region"
      aria-label="Events list"
    >
      <AsyncContent
        isLoading={isLoading}
        error={error}
        onRetry={onSortChange ? () => onSortChange(sortOrder) : undefined}
      >
        {/* Header with actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Filter button on the left */}
          <div className="flex justify-start items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="h-9"
            >
              <Filter className="h-4 w-4 mr-2" />
              {showFilters ? "Hide Filters" : "Show Filters"}
            </Button>
          </div>

          {/* Date sort button on the right */}
          <div className="flex justify-end items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                handleSortChange(sortOrder === "asc" ? "desc" : "asc")
              }
              aria-label={`Sort events by date in ${
                sortOrder === "asc" ? "descending" : "ascending"
              } order`}
            >
              {sortOrder === "asc" ? (
                <SortAsc className="h-4 w-4 mr-2" />
              ) : (
                <SortDesc className="h-4 w-4 mr-2" />
              )}
              Date
            </Button>
          </div>
        </div>
        {showFilters && (
          <EventFilter
            filter={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
            className="mb-6"
          />
        )}

        {/* Active filters display */}
        {filter && (
          <div
            className="flex flex-wrap gap-2"
            role="region"
            aria-label="Active filters"
          >
            {filter.status && filter.status.length > 0 && (
              <div className="text-sm px-3 py-1 rounded-full bg-muted text-muted-foreground">
                Status:{" "}
                {filter.status.map((s) => formatEventStatus(s)).join(", ")}
              </div>
            )}
            {filter.eventType && filter.eventType.length > 0 && (
              <div className="text-sm px-3 py-1 rounded-full bg-muted text-muted-foreground">
                Type:{" "}
                {filter.eventType.map((t) => formatEventType(t)).join(", ")}
              </div>
            )}
            {filter.searchQuery && (
              <div className="text-sm px-3 py-1 rounded-full bg-muted text-muted-foreground">
                Search: {filter.searchQuery}
              </div>
            )}
          </div>
        )}

        {/* Events grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              showRegistrationStatus={showRegistrationStatus}
              onRegister={onRegister}
              onViewDetails={onViewDetails}
            />
          ))}
        </div>
      </AsyncContent>
    </div>
  );
}
