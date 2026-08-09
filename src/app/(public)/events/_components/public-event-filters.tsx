"use client";

import { useRouter } from "next/navigation";

import { EventFilter } from "@/components/events/event-filter";
import type { EventFilter as EventFilterState } from "@/types/event";

import { buildPublicEventsFilterQuery } from "../_lib/public-events-query";

/**
 * Client wrapper around the shared EventFilter for the public list (UI-24
 * item 2). Filter changes are serialized into searchParams and navigated —
 * the server component stays the only data fetcher, and every filtered view
 * is a shareable URL.
 */
export function PublicEventFilters({ filter }: { filter: EventFilterState }) {
  const router = useRouter();

  const handleFilterChange = (next: EventFilterState) => {
    const query = buildPublicEventsFilterQuery(next);
    router.replace(query ? `/events?${query}` : "/events", { scroll: false });
  };

  const handleClearFilters = () => {
    router.replace("/events", { scroll: false });
  };

  return (
    <EventFilter
      filter={filter}
      onFilterChange={handleFilterChange}
      onClearFilters={handleClearFilters}
      className="mb-6"
    />
  );
}
