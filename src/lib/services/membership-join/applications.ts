/**
 * UI-33 — application track of the join funnel (decision D10).
 *
 * A signed-in member applies for a tier; staff review applications in the
 * backoffice. The service enforces what the schema documents:
 *
 *  - applications target active tiers only (inactive tiers 404 like unknown
 *    ones — the public surface never confirms admin-only rows exist),
 *  - one PENDING application per applicant + tier: the same account OR the
 *    same contact email with an open application for the tier is a conflict,
 *  - approval records the decision only — activating the membership itself
 *    happens in the subscription backoffice once the offline payment is
 *    recorded, so review here can never self-grant entitlements,
 *  - review is a privileged mutation: the status change and its auth_logs
 *    audit entry land in ONE db.transaction (never best-effort).
 */

import { and, count, desc, eq, or } from "drizzle-orm";
import { db } from "@/db/client";
import {
  membershipApplication,
  membershipTier,
  user,
  type MembershipApplication,
  type MembershipApplicationStatus,
} from "@/db/schema";
import { BusinessLogicError, NotFoundError } from "@/lib/errors";
import { getTier } from "@/lib/services/membership-tier.service";
import { writeAudit } from "@/lib/services/subscription/audit";
import type { ActorContext } from "@/lib/services/subscription.service";

export type ApplicationDecision = Extract<MembershipApplicationStatus, "APPROVED" | "REJECTED">;

export interface CreateApplicationInput {
  userId: string;
  tierId: string;
  name: string;
  email: string;
  organization?: string | null;
  message?: string | null;
}

export interface ApplicationWithTierName extends MembershipApplication {
  tierName: string;
}

export async function createMembershipApplication(
  input: CreateApplicationInput,
): Promise<ApplicationWithTierName> {
  const tier = await getTier(input.tierId); // NotFoundError on unknown ids
  if (!tier.isActive) throw new NotFoundError("Membership tier", input.tierId);

  // Duplicate-pending guard: same tier AND (same account OR same contact email).
  const duplicate = await db.query.membershipApplication.findFirst({
    where: and(
      eq(membershipApplication.tierId, tier.id),
      eq(membershipApplication.status, "PENDING"),
      or(
        eq(membershipApplication.userId, input.userId),
        eq(membershipApplication.email, input.email),
      ),
    ),
  });
  if (duplicate) {
    throw new BusinessLogicError(
      "You already have a pending application for this membership tier",
      "APPLICATION_DUPLICATE",
    );
  }

  const [row] = await db
    .insert(membershipApplication)
    .values({
      userId: input.userId,
      tierId: tier.id,
      name: input.name,
      email: input.email,
      organization: input.organization ?? null,
      message: input.message ?? null,
    })
    .returning();

  return { ...row, tierName: tier.displayName };
}

export interface ApplicationListFilters {
  status?: MembershipApplicationStatus;
  page?: number;
  limit?: number;
}

export interface ApplicationListItem extends MembershipApplication {
  tierName: string | null;
  applicantUsername: string | null;
}

export async function listMembershipApplications(
  filters: ApplicationListFilters = {},
): Promise<{ items: ApplicationListItem[]; total: number }> {
  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.min(100, Math.max(1, filters.limit ?? 20));
  const where = filters.status ? eq(membershipApplication.status, filters.status) : undefined;

  // Explicit leftJoins: one-sided drizzle relations are the codebase
  // convention, so relation-driven query building is not an option here.
  const rows = await db
    .select({
      application: membershipApplication,
      tierName: membershipTier.displayName,
      applicantUsername: user.username,
    })
    .from(membershipApplication)
    .leftJoin(membershipTier, eq(membershipApplication.tierId, membershipTier.id))
    .leftJoin(user, eq(membershipApplication.userId, user.id))
    .where(where)
    .orderBy(desc(membershipApplication.createdAt))
    .limit(limit)
    .offset((page - 1) * limit);

  const [countRow] = await db.select({ total: count() }).from(membershipApplication).where(where);

  return {
    items: rows.map((row) => ({
      ...row.application,
      tierName: row.tierName,
      applicantUsername: row.applicantUsername,
    })),
    total: countRow.total,
  };
}

/**
 * Record a review decision on a PENDING application. Privileged mutation:
 * row change + auth_logs entry share one transaction.
 */
export async function reviewMembershipApplication(
  applicationId: string,
  decision: ApplicationDecision,
  reviewNote: string | null,
  actor: ActorContext,
): Promise<ApplicationWithTierName> {
  const application = await db.query.membershipApplication.findFirst({
    where: eq(membershipApplication.id, applicationId),
  });
  if (!application) throw new NotFoundError("Membership application", applicationId);
  if (application.status !== "PENDING") {
    throw new BusinessLogicError(
      "This application has already been reviewed",
      "APPLICATION_ALREADY_REVIEWED",
    );
  }

  const reviewedAt = new Date();

  return db.transaction(async (tx) => {
    // The status guard repeats in the UPDATE so a concurrent review loses
    // with a conflict instead of a silent overwrite.
    const [row] = await tx
      .update(membershipApplication)
      .set({
        status: decision,
        reviewedBy: actor.actorId,
        reviewedAt,
        reviewNote,
        updatedAt: reviewedAt,
      })
      .where(
        and(
          eq(membershipApplication.id, applicationId),
          eq(membershipApplication.status, "PENDING"),
        ),
      )
      .returning();

    if (!row) {
      throw new BusinessLogicError(
        "This application has already been reviewed",
        "APPLICATION_ALREADY_REVIEWED",
      );
    }

    await writeAudit(tx, {
      userId: actor.actorId,
      eventType: "MEMBERSHIP_APPLICATION_REVIEWED",
      message: `Membership application ${applicationId} ${decision.toLowerCase()} by reviewer`,
      severity: "INFO",
      metadata: {
        applicationId,
        decision,
        tierId: application.tierId,
        applicantUserId: application.userId,
      },
      actor,
    });

    const tier = await getTier(row.tierId);
    return { ...row, tierName: tier.displayName };
  });
}
