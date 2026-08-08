import { problems, type ProblemDetails } from "@/lib/http";
import { logger } from "@/lib/logger";

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export class ForumServiceError extends Error {
  readonly problem: ProblemDetails;

  constructor(problem: ProblemDetails) {
    super(problem.detail ?? problem.title);
    this.name = "ForumServiceError";
    this.problem = problem;
  }
}

/** Maps any thrown error to a Problem; unexpected ones become 500s. */
export function forumProblemFromError(error: unknown): ProblemDetails {
  if (error instanceof ForumServiceError) return error.problem;
  logger.error("Unexpected forum service error", error);
  return problems.internalError();
}
