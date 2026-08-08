/**
 * Award service — the single DB access layer for award programs and
 * nominations (`award_programs` / `award_nominations`, backlog D4).
 *
 * Consumed by the /api/v1/awards route handlers. Throws
 * {@link AwardServiceError} carrying an RFC 9457 ProblemDetails payload;
 * callers map it through `problemResponse`.
 */

export { AwardServiceError } from "./errors";
export {
  createAwardNominationSchema,
  createAwardProgramSchema,
  updateAwardNominationSchema,
  updateAwardProgramSchema,
} from "./schemas";
export type {
  CreateAwardNominationInput,
  CreateAwardProgramInput,
  UpdateAwardNominationInput,
  UpdateAwardProgramInput,
} from "./schemas";
export type {
  AwardNominationListFilters,
  AwardProgramListFilters,
  Paginated,
} from "./query-helpers";
export { getAwardProgram, listAwardPrograms } from "./program-queries";
export { createAwardProgram, deleteAwardProgram, updateAwardProgram } from "./program-mutations";
export { getAwardNomination, listAwardNominations } from "./nomination-queries";
export {
  createAwardNomination,
  deleteAwardNomination,
  updateAwardNomination,
} from "./nomination-mutations";
