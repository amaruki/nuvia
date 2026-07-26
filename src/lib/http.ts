/**
 * RFC 9457 Problem Details — the sole API error contract.
 * See ADR-0002 and docs/api/conventions.md.
 */

import { NextResponse } from "next/server";
import type { ZodError } from "zod";
import { env } from "@/lib/env";

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  errors?: { field: string; message: string }[];
  [extension: string]: unknown;
}

function problemType(slug: string): string {
  return `${env.APP_URL}/problems/${slug}`;
}

export function problem(
  slug: string,
  status: number,
  title: string,
  detail?: string,
  extensions?: Record<string, unknown>,
): ProblemDetails {
  return {
    type: problemType(slug),
    title,
    status,
    ...(detail ? { detail } : {}),
    ...extensions,
  };
}

export const problems = {
  authenticationRequired: (detail?: string) =>
    problem("authentication-required", 401, "Authentication required", detail),
  insufficientPermission: (detail?: string) =>
    problem("insufficient-permission", 403, "Insufficient permission", detail),
  notFound: (detail?: string) => problem("not-found", 404, "Not found", detail),
  conflict: (detail?: string) => problem("conflict", 409, "Conflict", detail),
  businessLogicError: (detail?: string) =>
    problem("business-logic-error", 400, "Business logic error", detail),
  rateLimited: (detail?: string, retryAfterSeconds?: number) =>
    problem(
      "rate-limited",
      429,
      "Too many requests",
      detail,
      retryAfterSeconds !== undefined ? { retryAfterSeconds } : undefined,
    ),
  internalError: (detail?: string) =>
    problem("internal-error", 500, "Internal server error", detail),
};

/** Builds a validation-error Problem from a zod SafeParseError. */
export function validationProblem(error: ZodError): ProblemDetails {
  const errors = error.issues.map((issue) => ({
    field: issue.path.join(".") || "(root)",
    message: issue.message,
  }));

  return problem("validation-error", 422, "Validation failed", undefined, { errors });
}

/** The only sanctioned way to build an error response — application/problem+json. */
export function problemResponse(details: ProblemDetails, init?: ResponseInit): NextResponse {
  return NextResponse.json(details, {
    ...init,
    status: details.status,
    headers: {
      "Content-Type": "application/problem+json",
      ...init?.headers,
    },
  });
}

export interface SuccessMeta {
  timestamp?: string;
  version?: string;
  [key: string]: unknown;
}

/** The project-defined success envelope — RFC 9457 only standardizes errors. */
export function successResponse<T>(data: T, meta?: SuccessMeta, init?: ResponseInit): NextResponse {
  return NextResponse.json(
    {
      data,
      meta: {
        timestamp: new Date().toISOString(),
        version: "v1",
        ...meta,
      },
    },
    init,
  );
}
