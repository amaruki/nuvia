/**
 * Shared event write service types — DB enum spellings, the row shape, and
 * the wire DTO returned by the write operations.
 */

import { event } from "@/db/schema";
import {
  eventFormatEnum,
  eventStatusEnum,
  eventTypeEnum,
  eventVisibilityEnum,
} from "@/db/schema/enums";

export type DbEventType = (typeof eventTypeEnum.enumValues)[number];
export type DbEventFormat = (typeof eventFormatEnum.enumValues)[number];
export type DbEventStatus = (typeof eventStatusEnum.enumValues)[number];
export type DbEventVisibility = (typeof eventVisibilityEnum.enumValues)[number];

export type EventRow = typeof event.$inferSelect;

// ---------------------------------------------------------------------------
// Wire DTO — the stored row with Dates serialized as ISO strings. The read
// path keeps its UI-shaped mapping (event-read.service.ts, backlog B2); the
// write path returns the storage shape so admins see exactly what was saved.
// ---------------------------------------------------------------------------

export interface EventDto {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  categoryId: string;
  type: DbEventType;
  format: DbEventFormat;
  status: DbEventStatus;
  visibility: DbEventVisibility;
  capacity: number | null;
  registeredCount: number;
  waitlistCount: number;
  isVirtual: boolean;
  isFree: boolean;
  price: string | null;
  currency: string;
  location: string | null;
  virtualUrl: string | null;
  timezone: string;
  startTime: string;
  endTime: string;
  registrationStart: string | null;
  registrationEnd: string | null;
  allowWaitlist: boolean;
  requiresApproval: boolean;
  tags: string[];
  metadata: unknown;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
