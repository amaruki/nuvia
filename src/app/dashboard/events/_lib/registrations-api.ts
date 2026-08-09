/**
 * Client-side fetch helpers for the B3 registration routes
 * (/api/v1/events/[id]/registrations...). Used by the dashboard events
 * pages together with react-query.
 */

const API_BASE = "/api/v1/events";

interface ApiEnvelope<T> {
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    [key: string]: unknown;
  };
}

interface ApiProblem {
  title?: string;
  detail?: string;
  errors?: Array<{ field: string; message: string }>;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<ApiEnvelope<T>> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...init,
    headers: {
      "content-type": "application/json",
      ...init?.headers,
    },
  });

  let body: ApiEnvelope<T> | ApiProblem | null = null;
  try {
    body = (await res.json()) as ApiEnvelope<T> | ApiProblem;
  } catch {
    // Non-JSON error bodies fall through to the generic message below.
  }

  if (!res.ok) {
    const problem = body as ApiProblem | null;
    const detail =
      problem?.detail ??
      problem?.errors?.map((e) => `${e.field}: ${e.message}`).join(", ") ??
      problem?.title ??
      `Request failed with status ${res.status}`;
    throw new Error(detail);
  }

  return body as ApiEnvelope<T>;
}

// ---------------------------------------------------------------------------
// Registration wire types — the admin endpoints speak the DB vocabulary
// (uppercase statuses) and embed the attendee's user info.
// ---------------------------------------------------------------------------

export type RegistrationStatusDb =
  | "PENDING"
  | "CONFIRMED"
  | "WAITLISTED"
  | "CANCELED"
  | "ATTENDED"
  | "NO_SHOW";

export interface RegistrationAttendeeDto {
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
  status: RegistrationStatusDb;
  registeredAt: string;
  checkedInAt: string | null;
  checkedOutAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  user?: RegistrationAttendeeDto;
}

export interface RegistrationListResult {
  items: RegistrationDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const REGISTRATION_STATUS_LABELS: Record<RegistrationStatusDb, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  WAITLISTED: "Waitlisted",
  CANCELED: "Canceled",
  ATTENDED: "Attended",
  NO_SHOW: "No-show",
};

export const REGISTRATION_STATUS_BADGE_STYLES: Record<RegistrationStatusDb, string> = {
  PENDING: "bg-info/15 text-info hover:bg-info/15 border-transparent",
  CONFIRMED: "bg-success/15 text-success hover:bg-success/15 border-transparent",
  WAITLISTED: "bg-warning/15 text-warning hover:bg-warning/15 border-transparent",
  CANCELED: "bg-destructive/15 text-destructive hover:bg-destructive/15 border-transparent",
  ATTENDED: "bg-success/15 text-success hover:bg-success/15 border-transparent",
  NO_SHOW: "bg-destructive/15 text-destructive hover:bg-destructive/15 border-transparent",
};

export async function fetchEventRegistrations(
  eventId: string,
  params: { status?: RegistrationStatusDb[]; search?: string; page?: number; limit?: number } = {},
): Promise<RegistrationListResult> {
  const qs = new URLSearchParams();
  if (params.page !== undefined) qs.set("page", String(params.page));
  if (params.limit !== undefined) qs.set("limit", String(params.limit));
  if (params.search) qs.set("search", params.search);
  for (const status of params.status ?? []) qs.append("status", status);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";

  const envelope = await apiFetch<RegistrationDto[]>(
    `/${encodeURIComponent(eventId)}/registrations${suffix}`,
  );
  const meta = envelope.meta ?? {};

  return {
    items: envelope.data ?? [],
    total: meta.total ?? 0,
    page: meta.page ?? 1,
    limit: meta.limit ?? 20,
    totalPages: meta.totalPages ?? 1,
  };
}

export interface CancelRegistrationResult {
  registration: RegistrationDto;
  promoted: RegistrationDto | null;
}

export async function cancelEventRegistrationAdmin(
  eventId: string,
  registrationId: string,
  reason?: string,
): Promise<CancelRegistrationResult> {
  return (
    await apiFetch<CancelRegistrationResult>(
      `/${encodeURIComponent(eventId)}/registrations/${encodeURIComponent(registrationId)}/cancel`,
      {
        method: "POST",
        ...(reason ? { body: JSON.stringify({ reason }) } : {}),
      },
    )
  ).data;
}

export async function checkInEventRegistration(
  eventId: string,
  registrationId: string,
): Promise<RegistrationDto> {
  return (
    await apiFetch<RegistrationDto>(
      `/${encodeURIComponent(eventId)}/registrations/${encodeURIComponent(registrationId)}/check-in`,
      { method: "POST" },
    )
  ).data;
}
