/**
 * Registration reads — admin list of an event's registrations with attendee
 * info, status filters, search, and pagination.
 */

import { and, asc, count, desc, eq, ilike, inArray, or, type SQL } from "drizzle-orm";
import { db } from "@/db/client";
import { eventRegistration, user } from "@/db/schema";
import { toRegistrationDto } from "./mappers";
import type { ListRegistrationsQuery } from "./schemas";
import type { RegistrationListResult } from "./types";

/**
 * Admin list of an event's registrations with attendee info, filtering and
 * pagination. Search matches user name, username or email.
 */
export async function listRegistrations(
  eventId: string,
  query: ListRegistrationsQuery,
): Promise<RegistrationListResult> {
  const { page, limit } = query;
  const offset = (page - 1) * limit;

  const conditions: SQL[] = [eq(eventRegistration.eventId, eventId)];
  if (query.status?.length) conditions.push(inArray(eventRegistration.status, query.status));
  if (query.search) {
    const term = `%${query.search}%`;
    conditions.push(
      or(ilike(user.name, term), ilike(user.username, term), ilike(user.email, term))!,
    );
  }
  const where = and(...conditions);

  const [rows, totalResult] = await Promise.all([
    db
      .select({
        registration: eventRegistration,
        userName: user.name,
        userUsername: user.username,
        userEmail: user.email,
        userDisplayName: user.displayName,
      })
      .from(eventRegistration)
      .innerJoin(user, eq(eventRegistration.userId, user.id))
      .where(where)
      .orderBy(desc(eventRegistration.registeredAt), asc(eventRegistration.id))
      .limit(limit)
      .offset(offset),
    db
      .select({ value: count() })
      .from(eventRegistration)
      .innerJoin(user, eq(eventRegistration.userId, user.id))
      .where(where),
  ]);

  const total = totalResult[0]?.value ?? 0;

  return {
    registrations: rows.map((row) =>
      toRegistrationDto(row.registration, {
        id: row.registration.userId,
        name: row.userName,
        username: row.userUsername,
        email: row.userEmail,
        displayName: row.userDisplayName,
      }),
    ),
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}
