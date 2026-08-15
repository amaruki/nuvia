import type { Donation } from "@/types/finance";

import type { DonationWireRow } from "./types";

/** Hydrates a wire donation row (ISO dates, decimal-string amount) into the dashboard's Donation shape. */
export function hydrateDonation(row: DonationWireRow): Donation {
  return {
    id: row.id,
    // The donations table has no user FK (anonymous and organization donors
    // are not platform users), so the client type's donorId stays empty.
    donorId: "",
    donorName: row.donorName,
    donorEmail: row.donorEmail,
    donorType: row.donorType,
    donationType: row.donationType,
    campaign: row.campaign ?? undefined,
    amount: Number.parseFloat(row.amount),
    currency: row.currency,
    status: row.status,
    paymentMethod: row.paymentMethod ?? undefined,
    transactionId: row.transactionId ?? undefined,
    donationDate: new Date(row.donationDate),
    receiptSent: row.receiptSent,
    notes: row.notes ?? undefined,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}
