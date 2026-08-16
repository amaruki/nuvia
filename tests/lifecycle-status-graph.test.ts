/**
 * Issue #17 regression guard — lifecycle status graphs have no dead ends.
 *
 * Three audit findings shared one root cause: enum values the write paths
 * accept but nothing ever moves out of. SCHEDULED content stayed invisible
 * forever (no publisher), NO_SHOW registrations were rendered in the
 * dashboard but never written, and issue #16's PENDING registrations
 * rotted seats until approval existed. A graph test over every lifecycle
 * enum would have caught all three together.
 *
 * Rule: every status must be reachable (some mutation writes it, including
 * the create path) and escapable (some mutation moves out of it), unless it
 * is declared in the domain's terminal set — recorded outcomes and
 * soft-delete states whose whole point is having no exit. Terminal sets are
 * explicit constants, so adding a new terminal status is a deliberate,
 * reviewable act the suite does not silently tolerate.
 *
 * Pure unit test (no DB): the graphs are the same constants the services
 * enforce at write time, so the assertions run in every CI lane.
 */

import { describe, expect, test } from "bun:test";

import { contentStatusEnum, membershipStatusEnum, registrationStatusEnum } from "@/db/schema/enums";
import {
  CONTENT_TRANSITIONS,
  canPublishContent,
  type ContentActor,
} from "@/lib/services/content/lifecycle";
import { DB_STATUS_TO_UI, type UiStatus } from "@/lib/services/content/types";
import {
  REGISTRATION_TRANSITIONS,
  TERMINAL_REGISTRATION_STATUSES,
  type DbRegistrationStatus,
} from "@/lib/services/registration";
import {
  SUBSCRIPTION_STATUSES,
  SUBSCRIPTION_TRANSITIONS,
  TERMINAL_SUBSCRIPTION_STATUSES,
} from "@/lib/services/subscription/state-machine";

/**
 * Assert every status is reachable and escapable (or declared terminal).
 * `createdAs` lists statuses the create path writes directly — those count
 * as reachable even when no same-row transition targets them.
 */
function assertNoDeadEnds(
  domain: string,
  statuses: readonly string[],
  transitions: Record<string, readonly string[]>,
  terminal: readonly string[],
  createdAs: readonly string[],
): void {
  for (const status of statuses) {
    const exits = transitions[status];
    expect(exits, `${domain}: ${status} missing from the transition table`).toBeDefined();

    const incoming = statuses.filter((from) => transitions[from]?.includes(status));
    const reachable = incoming.length > 0 || createdAs.includes(status);

    if (terminal.includes(status)) {
      // Terminal statuses must be honest: documented, reachable, and truly
      // inescapable (an exit on a terminal status would mean the terminal
      // declaration is stale).
      expect(reachable, `${domain}: terminal status ${status} is never written by any path`).toBe(
        true,
      );
      expect(
        exits.length,
        `${domain}: terminal status ${status} declares exits it should not have`,
      ).toBe(0);
      continue;
    }

    expect(reachable, `${domain}: ${status} is unreachable — nothing ever writes it`).toBe(true);
    expect(
      exits.length,
      `${domain}: ${status} is a dead end — nothing ever moves out of it`,
    ).toBeGreaterThan(0);
    for (const to of exits) {
      expect(statuses, `${domain}: ${status} -> ${to} targets an unknown status`).toContain(to);
    }
  }
}

describe("status-graph regression (issue #17)", () => {
  test("content: every DB status maps to a UI status the graph covers", () => {
    for (const dbStatus of contentStatusEnum.enumValues) {
      expect(
        DB_STATUS_TO_UI[dbStatus],
        `content: DB status ${dbStatus} has no UI mapping`,
      ).toBeDefined();
    }
  });

  test("content: every UI status has at least one transition in and out", () => {
    // DELETED is the DB-level soft-delete terminal state: deleteContentItem
    // writes it and the lifecycle table intentionally has no exit (deleted
    // rows are immutable and hidden from every read path), so the graph
    // covers the five mutable statuses.
    const uiStatuses = Object.keys(CONTENT_TRANSITIONS) as UiStatus[];
    assertNoDeadEnds(
      "content",
      uiStatuses,
      CONTENT_TRANSITIONS as Record<string, readonly string[]>,
      [],
      [],
    );

    // The scheduled publisher (content/scheduler.ts) is the writer out of
    // SCHEDULED; assert the graph really offers that edge both ways.
    expect(CONTENT_TRANSITIONS.scheduled).toContain("published");
    expect(
      uiStatuses.some((from) => CONTENT_TRANSITIONS[from].includes("scheduled")),
      "content: no status can transition INTO scheduled",
    ).toBe(true);
  });

  test("content: scheduling is a publish-gated decision", () => {
    const publisher: ContentActor = {
      id: "pub",
      role: "staff",
      permissions: ["content:publish"],
    };
    const author: ContentActor = {
      id: "author",
      role: "organizer",
      permissions: ["content:update"],
    };
    expect(canPublishContent(publisher)).toBe(true);
    expect(canPublishContent(author)).toBe(false);
  });

  test("registration: every enum value is reachable and escapable or terminal", () => {
    // The create path writes PENDING (approval-gated), CONFIRMED, or
    // WAITLISTED (event full) directly; CANCELED rows are reused on
    // re-registration, which counts as a create-time write too.
    assertNoDeadEnds(
      "registration",
      registrationStatusEnum.enumValues as readonly DbRegistrationStatus[],
      REGISTRATION_TRANSITIONS as Record<string, readonly string[]>,
      TERMINAL_REGISTRATION_STATUSES as readonly string[],
      ["PENDING", "CONFIRMED", "WAITLISTED"],
    );

    // The graph must cover every enum value exactly (no drift either way).
    expect(Object.keys(REGISTRATION_TRANSITIONS).sort()).toEqual(
      [...registrationStatusEnum.enumValues].sort(),
    );
  });

  test("subscription: every enum value is reachable and escapable or terminal", () => {
    expect(SUBSCRIPTION_STATUSES).toEqual(membershipStatusEnum.enumValues);
    // The join funnel creates TRIALING (trialDays > 0), ACTIVE, or
    // PENDING_PAYMENT (unconfirmed checkout) directly.
    assertNoDeadEnds(
      "subscription",
      membershipStatusEnum.enumValues as readonly string[],
      SUBSCRIPTION_TRANSITIONS as Record<string, readonly string[]>,
      TERMINAL_SUBSCRIPTION_STATUSES as readonly string[],
      ["TRIALING", "ACTIVE", "PENDING_PAYMENT"],
    );
  });
});
