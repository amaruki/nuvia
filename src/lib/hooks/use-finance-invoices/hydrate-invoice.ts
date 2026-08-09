import type { Invoice, InvoicePayment } from "@/types/finance";

import type { InvoiceClientRow, PaymentRow } from "./types";

/** Hydrates a finance-report invoice row into the dashboard's Invoice shape. */
export function hydrateInvoice(row: InvoiceClientRow): Invoice {
  const issueDate = new Date(row.issuedAt);
  return {
    id: row.invoiceId,
    invoiceNumber: row.invoiceNumber ?? row.invoiceId.slice(0, 8).toUpperCase(),
    clientId: row.memberId ?? "",
    clientName: row.memberName ?? row.memberEmail ?? "Unknown member",
    clientEmail: row.memberEmail ?? "",
    items: row.items.map((item, index) => {
      const unitPrice = Number.parseFloat(item.unitPrice);
      return {
        id: `${row.invoiceId}:${index}`,
        description: item.description,
        quantity: item.quantity,
        unitPrice,
        total: unitPrice * item.quantity,
      };
    }),
    subtotal: Number.parseFloat(row.amount),
    taxAmount: 0,
    totalAmount: Number.parseFloat(row.amount),
    currency: "USD",
    status: row.status,
    issueDate,
    dueDate: row.dueDate ? new Date(row.dueDate) : issueDate,
    paidAmount: Number.parseFloat(row.paid),
    createdAt: issueDate,
    updatedAt: issueDate,
  };
}

/** Hydrates a membership_payments row into the dashboard's InvoicePayment shape. */
export function hydratePayment(row: PaymentRow): InvoicePayment {
  return {
    id: row.id,
    invoiceId: row.invoiceId ?? "",
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
