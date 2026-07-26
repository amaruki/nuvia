"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Filter,
  Calendar,
  MapPin,
  Users,
  X,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { EventStatus, EventType } from "@/types/event.types";
import type { EventFilter } from "@/types/event.types";

const eventFilterSchema = z.object({
  searchQuery: z.string().optional(),
  status: z.array(z.string()).optional(),
  eventType: z.array(z.string()).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  organizerId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isVirtual: z.boolean().optional(),
  isInPerson: z.boolean().optional(),
});

type EventFilterForm = z.infer<typeof eventFilterSchema>;

interface EventFilterProps {
  filter: EventFilter;
  onFilterChange: (filter: EventFilter) => void;
  onClearFilters: () => void;
  className?: string;
}

const statusOptions = [
  { value: EventStatus.DRAFT, label: "Draft" },
  { value: EventStatus.PUBLISHED, label: "Published" },
  { value: EventStatus.CANCELLED, label: "Cancelled" },
  { value: EventStatus.COMPLETED, label: "Completed" },
];

const eventTypeOptions = [
  { value: EventType.WORKSHOP, label: "Workshop" },
  { value: EventType.MEETUP, label: "Meetup" },
  { value: EventType.CONFERENCE, label: "Conference" },
  { value: EventType.WEBINAR, label: "Webinar" },
  { value: EventType.SOCIAL, label: "Social" },
  { value: EventType.TRAINING, label: "Training" },
  { value: EventType.OTHER, label: "Other" },
];

const tagOptions = [
  "web development",
  "workshop",
  "coding",
  "javascript",
  "community",
  "networking",
  "meetup",
  "technology",
  "react",
  "conference",
  "ui",
  "ux",
  "design",
  "masterclass",
  "javascript",
  "webinar",
  "online",
  "programming",
  "social",
  "team building",
  "fun",
];

export function EventFilterComponent({
  filter,
  onFilterChange,
  onClearFilters,
  className = "",
}: EventFilterProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [selectedTags, setSelectedTags] = React.useState<string[]>(filter.tags || []);
  const [tagInputValue, setTagInputValue] = React.useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<EventFilterForm>({
    resolver: zodResolver(eventFilterSchema),
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

  const handleAddTag = () => {
    if (tagInputValue.trim() && !selectedTags.includes(tagInputValue.trim())) {
      setSelectedTags([...selectedTags, tagInputValue.trim()]);
      setTagInputValue("");
    }
  };

  const handleClearAllFilters = () => {
    reset();
    setSelectedTags([]);
    onClearFilters();
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
              {/* Status Filter */}
              <div>
                <Label className="text-sm font-medium mb-3 text-muted-foreground">Status</Label>
                <div
                  className="grid grid-cols-2 sm:grid-cols-4 gap-2"
                  role="group"
                  aria-label="Filter by status"
                >
                  {statusOptions.map((option) => (
                    <Button
                      key={option.value}
                      type="button"
                      variant={watchedStatus.includes(option.value) ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleStatusToggle(option.value)}
                      className="text-xs justify-start"
                      aria-pressed={watchedStatus.includes(option.value)}
                    >
                      {watchedStatus.includes(option.value) && <Check className="h-3 w-3 mr-1" />}
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Event Type Filter */}
              <div>
                <Label className="text-sm font-medium mb-3 text-muted-foreground">Event Type</Label>
                <div
                  className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2"
                  role="group"
                  aria-label="Filter by event type"
                >
                  {eventTypeOptions.map((option) => (
                    <Button
                      key={option.value}
                      type="button"
                      variant={watchedEventType.includes(option.value) ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleEventTypeToggle(option.value)}
                      className="text-xs justify-start"
                      aria-pressed={watchedEventType.includes(option.value)}
                    >
                      {watchedEventType.includes(option.value) && (
                        <Check className="h-3 w-3 mr-1" />
                      )}
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate" className="text-sm font-medium">
                    Start Date
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    {...register("startDate", { valueAsDate: true })}
                    className="mt-1"
                    aria-describedby="startDate-description"
                  />
                  <span id="startDate-description" className="sr-only">
                    Filter events starting from this date
                  </span>
                </div>
                <div>
                  <Label htmlFor="endDate" className="text-sm font-medium">
                    End Date
                  </Label>
                  <Input
                    id="endDate"
                    type="date"
                    {...register("endDate", { valueAsDate: true })}
                    className="mt-1"
                    aria-describedby="endDate-description"
                  />
                  <span id="endDate-description" className="sr-only">
                    Filter events ending by this date
                  </span>
                </div>
              </div>

              {/* Format Filter */}
              <div>
                <Label className="text-sm font-medium mb-3 text-muted-foreground">Format</Label>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by format">
                  <Button
                    type="button"
                    variant={watchedIsVirtual ? "default" : "outline"}
                    size="sm"
                    onClick={() => setValue("isVirtual", !watchedIsVirtual)}
                    className="text-xs"
                    aria-pressed={watchedIsVirtual}
                  >
                    {watchedIsVirtual && <Check className="h-3 w-3 mr-1" />}
                    Virtual
                  </Button>
                  <Button
                    type="button"
                    variant={watchedIsInPerson ? "default" : "outline"}
                    size="sm"
                    onClick={() => setValue("isInPerson", !watchedIsInPerson)}
                    className="text-xs"
                    aria-pressed={watchedIsInPerson}
                  >
                    {watchedIsInPerson && <Check className="h-3 w-3 mr-1" />}
                    In-Person
                  </Button>
                </div>
              </div>

              {/* Tags Filter */}
              <div>
                <Label className="text-sm font-medium mb-3 text-muted-foreground">Tags</Label>
                <div className="mb-3">
                  <div className="flex gap-2">
                    <Input
                      value={tagInputValue}
                      onChange={(e) => setTagInputValue(e.target.value)}
                      placeholder="Add a custom tag..."
                      className="flex-1"
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                      aria-describedby="tag-input-description"
                    />
                    <span id="tag-input-description" className="sr-only">
                      Press Enter to add tag
                    </span>
                    <Button type="button" onClick={handleAddTag} size="sm" aria-label="Add tag">
                      Add
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by tags">
                  {tagOptions.map((tag) => (
                    <Button
                      key={tag}
                      type="button"
                      variant={selectedTags.includes(tag) ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleTagToggle(tag)}
                      className="text-xs"
                      aria-pressed={selectedTags.includes(tag)}
                    >
                      {selectedTags.includes(tag) && <Check className="h-3 w-3 mr-1" />}
                      {tag}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

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
