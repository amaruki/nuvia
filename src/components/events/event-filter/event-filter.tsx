"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, X, ChevronDown, ChevronUp } from "lucide-react";
import { EventStatus, EventType } from "@/types/event";
import { eventFilterFormSchema } from "@/lib/validation/event.validation";
import type { EventFilterForm, EventFilterProps, FilterChipKind } from "./types";
import { ActiveFilterChips } from "./active-filter-chips";
import { DateRangeFilter } from "./date-range-filter";
import { EventTypeFilter } from "./event-type-filter";
import { FormatFilter } from "./format-filter";
import { StatusFilter } from "./status-filter";
import { TagFilter } from "./tag-filter";

export function EventFilterComponent({
  filter,
  onFilterChange,
  onClearFilters,
  className = "",
}: EventFilterProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [selectedTags, setSelectedTags] = React.useState<string[]>(filter.tags || []);

  const { register, handleSubmit, watch, setValue, reset } = useForm<EventFilterForm>({
    resolver: zodResolver(eventFilterFormSchema),
    defaultValues: {
      searchQuery: filter.searchQuery || "",
      status: filter.status || [],
      eventType: filter.eventType || [],
      startDate: filter.startDate,
      endDate: filter.endDate,
      organizerId: filter.organizerId || "",
      tags: filter.tags || [],
      isVirtual: filter.isVirtual,
      isInPerson: filter.isInPerson,
    },
  });

  const watchedStatus = watch("status") || [];
  const watchedEventType = watch("eventType") || [];
  const watchedIsVirtual = watch("isVirtual");
  const watchedIsInPerson = watch("isInPerson");

  const onSubmit = (data: EventFilterForm) => {
    onFilterChange({
      ...data,
      status: data.status as EventStatus[],
      eventType: data.eventType as EventType[],
      tags: selectedTags,
    });
  };

  const handleStatusToggle = (status: string) => {
    const currentStatus = watchedStatus || [];
    const newStatus = currentStatus.includes(status)
      ? currentStatus.filter((s) => s !== status)
      : [...currentStatus, status];
    setValue("status", newStatus);
  };

  const handleEventTypeToggle = (eventType: string) => {
    const currentEventType = watchedEventType || [];
    const newEventType = currentEventType.includes(eventType)
      ? currentEventType.filter((e) => e !== eventType)
      : [...currentEventType, eventType];
    setValue("eventType", newEventType);
  };

  const handleTagToggle = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleClearAllFilters = () => {
    reset();
    setSelectedTags([]);
    onClearFilters();
  };

  const handleRemoveChip = (kind: FilterChipKind, value: string) => {
    switch (kind) {
      case "status":
        handleStatusToggle(value);
        break;
      case "eventType":
        handleEventTypeToggle(value);
        break;
      case "tag":
        handleTagToggle(value);
        break;
      case "format":
        if (value === "virtual") {
          setValue("isVirtual", undefined);
        } else {
          setValue("isInPerson", undefined);
        }
        break;
    }
  };

  const hasActiveFilters =
    watchedStatus.length > 0 ||
    watchedEventType.length > 0 ||
    selectedTags.length > 0 ||
    watchedIsVirtual !== undefined ||
    watchedIsInPerson !== undefined;

  return (
    <Card className={className} role="region" aria-label="Event filters">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Filter className="h-5 w-5 mr-2 text-primary" aria-hidden="true" />
            <span>Filter Events</span>
            {hasActiveFilters && (
              <Badge
                className="ml-2 bg-primary/10 text-primary"
                aria-label={`${[
                  watchedStatus.length,
                  watchedEventType.length,
                  selectedTags.length,
                  watchedIsVirtual !== undefined ? 1 : 0,
                  watchedIsInPerson !== undefined ? 1 : 0,
                ].reduce((a, b) => a + b, 0)} active filters`}
              >
                {[
                  watchedStatus.length,
                  watchedEventType.length,
                  selectedTags.length,
                  watchedIsVirtual !== undefined ? 1 : 0,
                  watchedIsInPerson !== undefined ? 1 : 0,
                ].reduce((a, b) => a + b, 0)}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-expanded={isExpanded}
            aria-controls="expanded-filters"
            className="h-8 w-8 p-0"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            <span className="sr-only">{isExpanded ? "Collapse filters" : "Expand filters"}</span>
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-0">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Search Input */}
          <div>
            <Label htmlFor="searchQuery" className="text-sm font-medium">
              Search
            </Label>
            <div className="relative mt-1">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="searchQuery"
                {...register("searchQuery")}
                placeholder="Search by title, description, location..."
                className="pl-10"
                aria-describedby="search-description"
              />
              <span id="search-description" className="sr-only">
                Search events by title, description, or location
              </span>
            </div>
          </div>

          {/* Expanded Filters */}
          {isExpanded && (
            <div id="expanded-filters" className="space-y-6 pt-4 border-t">
              <StatusFilter selected={watchedStatus} onToggle={handleStatusToggle} />

              <EventTypeFilter selected={watchedEventType} onToggle={handleEventTypeToggle} />

              <DateRangeFilter register={register} />

              <FormatFilter
                isVirtual={watchedIsVirtual}
                isInPerson={watchedIsInPerson}
                onToggleVirtual={() => setValue("isVirtual", !watchedIsVirtual)}
                onToggleInPerson={() => setValue("isInPerson", !watchedIsInPerson)}
              />

              <TagFilter
                selectedTags={selectedTags}
                onToggleTag={handleTagToggle}
                onAddTag={(tag) => setSelectedTags([...selectedTags, tag])}
              />
            </div>
          )}

          {/* Active Filter Chips */}
          <ActiveFilterChips
            status={watchedStatus}
            eventType={watchedEventType}
            tags={selectedTags}
            isVirtual={watchedIsVirtual}
            isInPerson={watchedIsInPerson}
            onRemove={handleRemoveChip}
          />

          {/* Filter Actions */}
          <div className="flex flex-col sm:flex-row sm:justify-between pt-4 border-t gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClearAllFilters}
              disabled={!hasActiveFilters}
              className="text-xs sm:w-auto"
              aria-label="Clear all filters"
            >
              <X className="h-3 w-3 mr-1" />
              Clear Filters
            </Button>
            <div className="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs"
                aria-expanded={isExpanded}
                aria-controls="expanded-filters"
              >
                {isExpanded ? "Show Less" : "Show More Filters"}
              </Button>
              <Button type="submit" className="text-xs" aria-label="Apply filters">
                <Search className="h-3 w-3 mr-1" />
                Apply Filters
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export { EventFilterComponent as EventFilter };
