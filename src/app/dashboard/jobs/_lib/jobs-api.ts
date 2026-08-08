/**
 * Client-side fetch helpers for the /api/v1/jobs routes, used by the
 * dashboard jobs pages together with react-query.
 */

import type { JobApplicationDto, JobBoardMeta, JobPostingDto } from "@/types/jobs.types";

const API_BASE = "/api/v1/jobs";

interface ApiEnvelope<T> {
  data: T;
  meta?: Record<string, unknown>;
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
// Postings
// ---------------------------------------------------------------------------

export interface JobPostingListParams {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface JobPostingListResult {
  items: JobPostingDto[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export async function fetchJobPostings(
  params: JobPostingListParams = {},
): Promise<JobPostingListResult> {
  const searchParams = new URLSearchParams();
  if (params.search) searchParams.set("search", params.search);
  if (params.status) searchParams.set("status", params.status);
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  const query = searchParams.toString();

  const envelope = await apiFetch<JobPostingDto[]>(query ? `?${query}` : "");
  const meta = envelope.meta ?? {};
  return {
    items: envelope.data,
    page: (meta.page as number) ?? 1,
    limit: (meta.limit as number) ?? 20,
    total: (meta.total as number) ?? envelope.data.length,
    totalPages: (meta.totalPages as number) ?? 1,
  };
}

export async function fetchJobPosting(id: string): Promise<JobPostingDto> {
  return (await apiFetch<JobPostingDto>(`/${id}`)).data;
}

export async function fetchJobBoardMeta(): Promise<JobBoardMeta> {
  return (await apiFetch<JobBoardMeta>("/meta")).data;
}

export type JobPostingCreateInput = Record<string, unknown>;
export type JobPostingUpdateInput = Record<string, unknown>;

export async function createJobPosting(input: JobPostingCreateInput): Promise<JobPostingDto> {
  return (
    await apiFetch<JobPostingDto>("", {
      method: "POST",
      body: JSON.stringify(input),
    })
  ).data;
}

export async function updateJobPosting(
  id: string,
  input: JobPostingUpdateInput,
): Promise<JobPostingDto> {
  return (
    await apiFetch<JobPostingDto>(`/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    })
  ).data;
}

export async function deleteJobPosting(id: string): Promise<void> {
  await apiFetch<{ id: string; deleted: boolean }>(`/${id}`, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// Applications
// ---------------------------------------------------------------------------

export interface ApplicationListResult {
  items: JobApplicationDto[];
  total: number;
}

export async function fetchJobApplications(
  jobId: string,
  params: { status?: string; page?: number; limit?: number } = {},
): Promise<ApplicationListResult> {
  const searchParams = new URLSearchParams();
  if (params.status) searchParams.set("status", params.status);
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  const query = searchParams.toString();

  const envelope = await apiFetch<JobApplicationDto[]>(
    `/${jobId}/applications${query ? `?${query}` : ""}`,
  );
  return {
    items: envelope.data,
    total: (envelope.meta as { total?: number } | undefined)?.total ?? envelope.data.length,
  };
}

export async function fetchJobApplication(
  jobId: string,
  applicationId: string,
): Promise<JobApplicationDto> {
  return (await apiFetch<JobApplicationDto>(`/${jobId}/applications/${applicationId}`)).data;
}

export async function updateApplicationStatus(
  jobId: string,
  applicationId: string,
  status: string,
  notes?: string,
): Promise<JobApplicationDto> {
  return (
    await apiFetch<JobApplicationDto>(`/${jobId}/applications/${applicationId}`, {
      method: "PATCH",
      body: JSON.stringify({ status, ...(notes !== undefined ? { notes } : {}) }),
    })
  ).data;
}
