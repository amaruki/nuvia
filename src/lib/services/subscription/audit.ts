/**
 * Same-transaction audit writes — every lifecycle transition records its
 * auth_logs entry inside the caller's db.transaction; the audit is never
 * best-effort (ADR-0009, docs/technical-specs/07-security.md).
 */

import { db } from "@/db/client";
import { authLog } from "@/db/schema";
import type { ActorContext } from "./types";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function writeAudit(
  tx: Tx,
  entry: {
    userId: string;
    eventType: string;
    message: string;
    severity?: string;
    metadata: Record<string, unknown>;
    actor: ActorContext;
  },
): Promise<void> {
  await tx.insert(authLog).values({
    userId: entry.userId,
    eventType: entry.eventType,
    severity: entry.severity ?? "INFO",
    message: entry.message,
    ipAddress: entry.actor.ipAddress,
    userAgent: entry.actor.userAgent,
    metadata: { ...entry.metadata, actorId: entry.actor.actorId, reason: entry.actor.reason },
  });
}
