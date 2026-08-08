/**
 * Member directory service — backlog B1 (Members on real data).
 *
 * Serves the member directory API (`/api/v1/members`) from the database:
 * users joined with their newest `membership_subscription`, with the member
 * status derived through the A3 derivation (ADR-0014). This service IMPORTS
 * `deriveMemberStatus` and never re-derives status ad hoc; the single SQL
 * expression of the rule is `derivedMemberStatusSql`, the mirror that lets
 * the listing's status filter run in the database.
 *
 * Permission mapping (authoritative note lives on the routes):
 * - list   -> `memberships:read` (membership-flavored directory listing)
 * - detail -> `users:read` (item exposes user-management data plus
 *   subscription history)
 *
 * Split from src/lib/services/member.service.ts, which stays as a
 * re-export shim so `@/lib/services/member.service` keeps resolving.
 */

export type {
  MemberDetail,
  MemberDetailUser,
  MemberListItem,
  MemberListParams,
  MemberListResult,
  MemberSortField,
  MemberSubscriptionSummary,
  SubscriptionHistoryEntry,
} from "./types";
export { getMemberDetail, listMembers } from "./queries";
