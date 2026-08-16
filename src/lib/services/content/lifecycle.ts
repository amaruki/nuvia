/**
 * Content lifecycle state machine (issue #25).
 *
 * Before this module existed, `patchContent` accepted any status from the
 * enum and wrote it through: no current-status check, no transition table,
 * no actor differentiation. Anyone holding `content:update` (committee
 * chairs, organizers, chapter admins) could publish or re-publish content
 * without the `content:publish` permission ever being consulted, and
 * submitting an item to "review" stamped `reviewedAt` immediately, faking
 * the review pass.
 *
 * The write paths now enforce:
 *
 *   draft ──────► review | published | scheduled | archived
 *   review ─────► draft | published | scheduled | archived
 *   published ──► archived | draft
 *   scheduled ──► draft | published | archived
 *   archived ───► draft | review | published
 *
 * Any transition INTO published/scheduled, or OUT OF published/scheduled
 * (unpublishing), requires `content:publish` (or `content:manage`).
 * `reviewedAt` is stamped only when a publisher approves content, never on
 * review submission, and authorship can only be reassigned with
 * `content:manage`. Rows soft-deleted to DELETED are immutable and hidden
 * from every read path (mutations.ts / queries.ts).
 */

import type { Permission } from "@/types/role";

import type { UiStatus } from "./types";

/** What the content service needs about the acting user (routes pass auth.user). */
export interface ContentActor {
  id: string;
  role: string;
  permissions?: readonly Permission[];
}

/** Legal UI-status transitions; DELETED rows never appear here (terminal). */
export const CONTENT_TRANSITIONS: Record<UiStatus, readonly UiStatus[]> = {
  draft: ["review", "published", "scheduled", "archived"],
  review: ["draft", "published", "scheduled", "archived"],
  published: ["archived", "draft"],
  scheduled: ["draft", "published", "archived"],
  archived: ["draft", "review", "published"],
};

/** Statuses whose entry or exit is an editorial publish decision. */
const PUBLISH_GATE_STATUSES: readonly UiStatus[] = ["published", "scheduled"];

export function actorHasPermission(actor: ContentActor, permission: Permission): boolean {
  return actor.role === "superadmin" || (actor.permissions ?? []).includes(permission);
}

export function canPublishContent(actor: ContentActor): boolean {
  return actorHasPermission(actor, "content:publish");
}

export function canManageContent(actor: ContentActor): boolean {
  return actorHasPermission(actor, "content:manage");
}

/** Editorial callers may edit any item and ghost-write for other authors. */
export function isEditorial(actor: ContentActor): boolean {
  return canPublishContent(actor) || canManageContent(actor);
}

/** True when moving between these two statuses is a publish decision. */
export function transitionTouchesPublish(from: UiStatus, to: UiStatus): boolean {
  return PUBLISH_GATE_STATUSES.includes(from) || PUBLISH_GATE_STATUSES.includes(to);
}

export function isLegalTransition(from: UiStatus, to: UiStatus): boolean {
  return CONTENT_TRANSITIONS[from]?.includes(to) ?? false;
}
