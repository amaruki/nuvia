/**
 * Row mapping for the event write path — storage row to wire DTO.
 */

import type { EventDto, EventRow } from "./types";

export function toEventDto(row: EventRow): EventDto {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    shortDescription: row.shortDescription,
    categoryId: row.categoryId,
    type: row.type,
    format: row.format,
    status: row.status,
    visibility: row.visibility,
    capacity: row.capacity,
    registeredCount: row.registeredCount,
    waitlistCount: row.waitlistCount,
    isVirtual: row.isVirtual,
    isFree: row.isFree,
    price: row.price,
    currency: row.currency,
    location: row.location,
    virtualUrl: row.virtualUrl,
    timezone: row.timezone,
    startTime: row.startTime.toISOString(),
    endTime: row.endTime.toISOString(),
    registrationStart: row.registrationStart?.toISOString() ?? null,
    registrationEnd: row.registrationEnd?.toISOString() ?? null,
    allowWaitlist: row.allowWaitlist,
    requiresApproval: row.requiresApproval,
    tags: row.tags,
    metadata: row.metadata,
    createdBy: row.createdBy,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
