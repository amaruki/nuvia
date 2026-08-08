/**
 * Committees service — the single DB access layer for the committees module
 * (backlog D2). Every /api/v1/committees/** route handler goes through here.
 *
 * Errors are thrown as NotFoundError / BusinessLogicError (src/lib/errors.ts)
 * and mapped to RFC 9457 problems by src/app/api/v1/committees/_lib.ts —
 * the same split the finance services use.
 *
 * The wire shape is the UI contract from src/types/committee/:
 * charter/meetings/metrics travel as jsonb columns and are normalized on
 * read; leadership and members share the committee_members table and are
 * split by role on read.
 */

export {
  COMMITTEE_AUTHORITY_LEVELS,
  COMMITTEE_ROLES,
  COMMITTEE_STATUSES,
  COMMITTEE_TYPES,
  committeeCharterInputSchema,
  committeeContactInfoInputSchema,
  committeeTermLimitsSchema,
  createCommitteeSchema,
  updateCommitteeSchema,
} from "./schemas";
export type { CreateCommitteeInput, UpdateCommitteeInput } from "./schemas";
export { getCommittee, listCommittees } from "./queries";
export type { CommitteeListFilters, CommitteeListResult } from "./queries";
export { createCommittee, deleteCommittee, updateCommittee } from "./mutations";
