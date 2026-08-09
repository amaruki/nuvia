import type { DuePayment, MemberDue } from "@/types/finance";

import type { DuesLedgerRow, PaymentRow } from "./types";

/** Hydrates a dues-ledger row into the dashboard's MemberDue shape. */
export function hydrateMemberDue(row: DuesLedgerRow): MemberDue {
  const issuedAt = new Date(row.issuedAt);
  return {
    id: row.invoiceId,
    memberId: row.memberId ?? "",
    memberName: row.memberName ?? row.memberEmail ?? "Unknown member",
    memberEmail: row.memberEmail ?? "",
    membershipTier: row.tierName ?? "—",
    dueAmount: Number.parseFloat(row.amount),
    paidAmount: Number.parseFloat(row.paid),
    balanceAmount: Number.parseFloat(row.balance),
    dueDate: row.dueDate ? new Date(row.dueDate) : issuedAt,
    status: row.status,
    createdAt: issuedAt,
    updatedAt: issuedAt,
  };
}

/** Hydrates a membership_payments row into the dashboard's DuePayment shape. */
export function hydrateDuePayment(row: PaymentRow): DuePayment {
  return {
    id: row.id,
    dueId: row.invoiceId ?? "",
    amount: Number.parseFloat(row.amount),
    paymentDate: new Date(row.paidAt ?? row.createdAt),
    paymentMethod: row.paymentMethod ?? "manual",
    transactionId: row.providerTxId ?? row.id,
    status:
      row.status === "COMPLETED"
        ? "completed"
        : row.status === "FAILED"
          ? "failed"
          : row.status === "REFUNDED"
            ? "refunded"
            : "pending",
    processedBy: row.paymentProvider ?? "manual",
    createdAt: new Date(row.createdAt),
  };
}
