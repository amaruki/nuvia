/**
 * Server-side query model for the public events list (UI-24 items 1+2).
 *
 * searchParams are the single source of truth: pagination and every filter
 * live in the URL so the page stays server-rendered, linkable, and
 * crawlable. The client EventFilter form only rewrites the same URL; the
 * pagination links only rewrite `page`.
 */

import type { ListEventsParams } from "@/lib/services/event-read.service";
import {
  IN_PERSON_EVENT_FORMATS,
  UI_TO_DB_EVENT_STATUS,
  UI_TO_DB_EVENT_TYPE,
  type DbEventStatus,
} from "@/lib/utils/event-utils";
import { EventStatus, EventType, type EventFilter } from "@/types/event";

/** Fixed page size for the public list — big enough to browse, small enough to paginate. */
export const PUBLIC_EVENTS_PAGE_SIZE = 12;

/** DB lifecycle statuses that may appear on the public list. */
const PUBLIC_DB_STATUSES: DbEventStatus[] = [
  "PUBLISHED",
  "REGISTRATION_OPEN",
  "REGISTRATION_CLOSED",
  "IN_PROGRESS",
];

const UI_STATUSES: Record<string, true> = {
  [EventStatus.DRAFT]: true,
  [EventStatus.PUBLISHED]: true,
  [EventStatus.CANCELLED]: true,
  [EventStatus.COMPLETED]: true,
};

const UI_EVENT_TYPES: Record<string, true> = {
  [EventType.WORKSHOP]: true,
  [EventType.MEETUP]: true,
  [EventType.CONFERENCE]: true,
  [EventType.WEBINAR]: true,
  [EventType.SOCIAL]: true,
  [EventType.TRAINING]: true,
  [EventType.OTHER]: true,
};

const MAX_SEARCH_LENGTH = 200;
const MAX_TAGS = 10;

export interface PublicEventsQuery {
  page: number;
  /** UI filter state fed back into the EventFilter form. */
  filter: EventFilter;
  /** Params for the server-side listEvents(). */
  listParams: ListEventsParams;
  /** True when the selection cannot match any public event (e.g. status=cancelled). */
  forceEmpty: boolean;
}

function parsePage(raw: string | null): number {
  const parsed = Number.parseInt(raw ?? "", 10);
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : 1;
}

function parseDate(raw: string | null): Date | undefined {
  if (!raw) return undefined;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export function parsePublicEventsSearchParams(searchParams: URLSearchParams): PublicEventsQuery {
  const page = parsePage(searchParams.get("page"));
  const searchQuery = searchParams.get("q")?.trim().slice(0, MAX_SEARCH_LENGTH) || undefined;
  const status = searchParams
    .getAll("status")
    .filter((value): value is EventStatus => UI_STATUSES[value] === true);
  const eventType = searchParams
    .getAll("type")
    .filter((value): value is EventType => UI_EVENT_TYPES[value] === true);
  const tags = searchParams
    .getAll("tags")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, MAX_TAGS);
  const startDate = parseDate(searchParams.get("from"));
  const endDate = parseDate(searchParams.get("to"));
  const isVirtual = searchParams.get("virtual") === "true" || undefined;
  const isInPerson = searchParams.get("inPerson") === "true" || undefined;

  const filter: EventFilter = {
    ...(searchQuery ? { searchQuery } : {}),
    ...(status.length > 0 ? { status } : {}),
    ...(eventType.length > 0 ? { eventType } : {}),
    ...(startDate ? { startDate } : {}),
    ...(endDate ? { endDate } : {}),
    ...(tags.length > 0 ? { tags } : {}),
    ...(isVirtual ? { isVirtual } : {}),
    ...(isInPerson ? { isInPerson } : {}),
  };

  // UI status buckets expand to DB statuses, restricted to what the public
  // list shows. A selection with no public mapping (cancelled/completed) can
  // never match — report an honest empty list instead of ignoring the filter.
  const dbStatuses = [...new Set(status.flatMap((s) => UI_TO_DB_EVENT_STATUS[s]))].filter((s) =>
    PUBLIC_DB_STATUSES.includes(s),
  );
  const forceEmpty = status.length > 0 && dbStatuses.length === 0;

  const listParams: ListEventsParams = {
    page,
    limit: PUBLIC_EVENTS_PAGE_SIZE,
    visibility: ["PUBLIC"],
    status: status.length > 0 ? dbStatuses : PUBLIC_DB_STATUSES,
    sortBy: "startTime",
    sortOrder: "asc",
  };
  if (searchQuery) listParams.search = searchQuery;
  if (eventType.length > 0) {
    listParams.type = [...new Set(eventType.flatMap((t) => UI_TO_DB_EVENT_TYPE[t]))];
  }
  if (startDate) listParams.startDate = startDate;
  if (endDate) listParams.endDate = endDate;
  if (tags.length > 0) listParams.tags = tags;
  // Mirrors the admin client translation: isVirtual maps 1:1 and isInPerson
  // expands to the physical formats. Both on means "any format", so neither
  // filter is applied.
  if (isVirtual && !isInPerson) listParams.isVirtual = true;
  if (isInPerson && !isVirtual) listParams.format = IN_PERSON_EVENT_FORMATS;

  return { page, filter, listParams, forceEmpty };
}

/** Serializes a Date as YYYY-MM-DD so date inputs round-trip through the URL. */
function toDateInputValue(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Builds the query string for a filter state (used by the client form and tests). */
export function buildPublicEventsFilterQuery(filter: EventFilter): string {
  const params = new URLSearchParams();
  if (filter.searchQuery) params.set("q", filter.searchQuery);
  for (const value of filter.status ?? []) params.append("status", value);
  for (const value of filter.eventType ?? []) params.append("type", value);
  if (filter.startDate) params.set("from", toDateInputValue(filter.startDate));
  if (filter.endDate) params.set("to", toDateInputValue(filter.endDate));
  for (const tag of filter.tags ?? []) params.append("tags", tag);
  if (filter.isVirtual) params.set("virtual", "true");
  if (filter.isInPerson) params.set("inPerson", "true");
  return params.toString();
}

/** Builds a public-list href for a target page while preserving active filters. */
export function publicEventsHref(searchParams: URLSearchParams, page: number): string {
  const params = new URLSearchParams(searchParams);
  if (page <= 1) params.delete("page");
  else params.set("page", String(page));
  const query = params.toString();
  return query ? `/events?${query}` : "/events";
}
