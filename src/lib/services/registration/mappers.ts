/**
 * Row → DTO mapping. Notes travel in the jsonb metadata column and surface
 * as a flat DTO field.
 */

import type { RegistrationDto, RegistrationRow, RegistrationUserDto } from "./types";

export function toRegistrationDto(
  row: RegistrationRow,
  userInfo?: RegistrationUserDto,
): RegistrationDto {
  return {
    id: row.id,
    eventId: row.eventId,
    userId: row.userId,
    status: row.status,
    registeredAt: row.registeredAt.toISOString(),
    checkedInAt: row.checkedInAt?.toISOString() ?? null,
    checkedOutAt: row.checkedOutAt?.toISOString() ?? null,
    notes: ((row.metadata as { notes?: string } | null)?.notes ?? null) as string | null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    ...(userInfo ? { user: userInfo } : {}),
  };
}
