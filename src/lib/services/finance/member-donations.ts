/**
 * UI-34 — donation capability report.
 *
 * The membership schema (src/db/schema/membership.ts) has NO donation
 * tables — the ledger tracks membership dues only (see the backoffice
 * donations page, dashboard/finance/donations). This module reports that
 * gap honestly instead of inventing a schema or faking a flow; the public
 * /donate page renders it as-is.
 *
 * When a donation store is added (schema + migration + service), change
 * DonationCapability.available to a boolean, implement the read here, and
 * the type system will flag every site that assumed the gap.
 */

import type { DonationCapability } from "./types";

/** The gap, in one sentence, for pages, tests, and the eventual backlog item. */
export const DONATION_SCHEMA_GAP =
  "No donation schema exists in this deployment yet. The membership schema tracks dues only, so online donations cannot be accepted.";

export function getDonationCapability(): DonationCapability {
  return {
    available: false,
    reason: DONATION_SCHEMA_GAP,
    // Point at what DOES exist rather than pretending to take money.
    alternatives: [
      { label: "Support us by becoming a member", href: "/membership" },
      { label: "Members: manage your dues and invoices", href: "/dashboard/my/finance" },
    ],
  };
}
