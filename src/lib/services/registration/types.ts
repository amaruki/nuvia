/**
 * Shared registration service types — row shapes, the DB status enum, wire
 * DTOs, and the cancel-actor / list-result contracts.
 */

import { event, eventRegistration } from "@/db/schema";
import { registrationStatusEnum } from "@/db/schema/enums";

export type EventRow = typeof event.$inferSelect;
export type RegistrationRow = typeof eventRegistration.$inferSelect;

export type DbRegistrationStatus = (typeof registrationStatusEnum.enumValues)[number];

// ---------------------------------------------------------------------------
// Wire DTOs
// ---------------------------------------------------------------------------

export interface RegistrationUserDto {
  id: string;
  name: string;
  username: string;
  email: string;
  displayName: string | null;
}

export interface RegistrationDto {
  id: string;
  eventId: string;
  userId: string;
  status: DbRegistrationStatus;
  registeredAt: string;
  checkedInAt: string | null;
  checkedOutAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  /** Present on admin list results (hydrated from the users table). */
  user?: RegistrationUserDto;
}

// ---------------------------------------------------------------------------
// Actor and list contracts
// ---------------------------------------------------------------------------

export interface CancelRegistrationActor {
  userId: string;
  /** True when the caller holds events:manage — may cancel any registration. */
  canManage: boolean;
}

export interface RegistrationListResult {
  registrations: RegistrationDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
