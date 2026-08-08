import type { ProblemDetails } from "@/lib/http";

export class JobServiceError extends Error {
  constructor(public readonly problemDetails: ProblemDetails) {
    super(problemDetails.detail ?? problemDetails.title);
    this.name = "JobServiceError";
  }
}
