/**
 * Minimal typed client for the Nuvia REST API (docs/api/conventions.md).
 * Success envelope: { data, meta? } — errors are RFC 9457 problem documents.
 */

export interface ProblemBody {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  errors?: { field: string; message: string }[];
}

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly problem: ProblemBody | null,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

export interface ApiEnvelope<T> {
  data: T;
  meta?: { page?: number; limit?: number; total?: number; totalPages?: number };
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<ApiEnvelope<T>> {
  // Multipart bodies carry their own boundary in the Content-Type, so the
  // JSON default must not override what fetch derives from a FormData body.
  const isFormData = typeof FormData !== "undefined" && init?.body instanceof FormData;
  const response = await fetch(path, {
    credentials: "same-origin",
    ...init,
    headers: isFormData
      ? { ...init?.headers }
      : { "Content-Type": "application/json", ...init?.headers },
  });

  let body: unknown = null;
  const text = await response.text();
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = null;
    }
  }

  if (!response.ok) {
    const problem = (body ?? {}) as ProblemBody;
    const message =
      problem.detail ??
      (problem.errors?.length ? problem.errors.map((e) => e.message).join(", ") : undefined) ??
      problem.title ??
      response.statusText ??
      "Request failed";
    throw new ApiClientError(message, response.status, problem);
  }

  return (body ?? { data: null }) as ApiEnvelope<T>;
}
