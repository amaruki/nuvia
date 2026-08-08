/**
 * Custom hooks for event-related data fetching and operations
 */

import { useState, useEffect, useCallback } from "react";
import { Event, EventFilter, EventListResponse, EventDetailsResponse } from "@/types/event.types";
import { getEvents, getEventById } from "@/lib/services/event";
import { logger } from "@/lib/logger";

/**
 * Hook for fetching events with optional filtering and pagination
 */
export function useEvents(filter?: EventFilter, page = 1, pageSize = 10) {
  const [data, setData] = useState<EventListResponse | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await getEvents(filter, page, pageSize);
      setData(response);
      setEvents(response.events);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch events";
      setError(errorMessage);
      logger.error("Error fetching events", err);
    } finally {
      setIsLoading(false);
    }
  }, [filter, page, pageSize]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return {
    events,
    data,
    isLoading,
    error,
    refetch: fetchEvents,
  };
}

/**
 * Hook for fetching a single event by ID
 */
export function useEvent(eventId: string) {
  const [data, setData] = useState<EventDetailsResponse | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvent = useCallback(async () => {
    if (!eventId) return;

    try {
      setIsLoading(true);
      setError(null);
      const response = await getEventById(eventId);
      setData(response);
      setEvent(response.event);
      setIsRegistered(response.isRegistered);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch event";
      setError(errorMessage);
      logger.error(`Error fetching event with ID ${eventId}`, err);
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  return {
    event,
    data,
    isRegistered,
    isLoading,
    error,
    refetch: fetchEvent,
  };
}

/**
 * Hook for managing event filters
 */
export function useEventFilters(initialFilters: EventFilter = {}) {
  const [filters, setFilters] = useState<EventFilter>(initialFilters);

  const updateFilter = useCallback((key: keyof EventFilter, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const addFilterValue = useCallback((key: keyof EventFilter, value: any) => {
    setFilters((prev) => {
      const currentValues = (prev[key] as any[]) || [];
      if (currentValues.includes(value)) {
        return {
          ...prev,
          [key]: currentValues.filter((v) => v !== value),
        };
      }
      return {
        ...prev,
        [key]: [...currentValues, value],
      };
    });
  }, []);

  const removeFilterValue = useCallback((key: keyof EventFilter, value: any) => {
    setFilters((prev) => {
      const currentValues = (prev[key] as any[]) || [];
      return {
        ...prev,
        [key]: currentValues.filter((v) => v !== value),
      };
    });
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const hasActiveFilters = Object.keys(filters).some((key) => {
    const value = filters[key as keyof EventFilter];
    return Array.isArray(value) ? value.length > 0 : !!value;
  });

  return {
    filters,
    updateFilter,
    addFilterValue,
    removeFilterValue,
    clearFilters,
    hasActiveFilters,
  };
}
