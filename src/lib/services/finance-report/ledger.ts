/**
 * Dues ledger + invoice listings — org-wide ledger with derived dashboard
 * statuses, and the member-context invoice list with line items.
 */

import { asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { membershipInvoice, membershipInvoiceItem, membershipTier, user } from "@/db/schema";
import { toAmountString, toMinorUnits } from "@/lib/payments/gateway";
import { MAX_AGGREGATE_ROWS } from "./helpers";
import type {
  DuesLedgerQuery,
  DuesLedgerRow,
  DuesUiStatus,
  InvoiceClientQuery,
  InvoiceClientRow,
  ListResult,
} from "./types";

function deriveDuesStatus(
  invoice: { status: "ISSUED" | "PAID" | "VOID"; paidAmount: string; dueDate: Date | null },
  now: Date,
): DuesUiStatus {
  if (invoice.status === "PAID") return "paid";
  if (invoice.status === "VOID") return "cancelled";
  if (invoice.dueDate !== null && invoice.dueDate.getTime() < now.getTime()) return "overdue";
  if (toMinorUnits(invoice.paidAmount) > 0) return "partial";
  return "pending";
}

/** One query for the ledger/invoice joins, ordered newest-first. */
async function fetchInvoicesWithClientContext(userId?: string) {
  const invoices = await db
    .select({
      invoiceId: membershipInvoice.id,
      invoiceNumber: membershipInvoice.invoiceNumber,
      subscriptionId: membershipInvoice.subscriptionId,
      status: membershipInvoice.status,
      totalAmount: membershipInvoice.totalAmount,
      paidAmount: membershipInvoice.paidAmount,
      issuedAt: membershipInvoice.createdAt,
      dueDate: membershipInvoice.dueDate,
      memberId: user.id,
      memberName: user.name,
      memberEmail: user.email,
      tierId: membershipInvoice.tierId,
      tierName: membershipTier.name,
    })
    .from(membershipInvoice)
    .leftJoin(user, eq(membershipInvoice.userId, user.id))
    .leftJoin(membershipTier, eq(membershipInvoice.tierId, membershipTier.id))
    .orderBy(desc(membershipInvoice.createdAt), asc(membershipInvoice.id))
    .limit(MAX_AGGREGATE_ROWS);

  return userId ? invoices.filter((row) => row.memberId === userId) : invoices;
}

async function fetchItemsForInvoices(invoiceIds: string[]) {
  if (invoiceIds.length === 0) return new Map<string, InvoiceClientRow["items"]>();

  const items = await db
    .select({
      invoiceId: membershipInvoiceItem.invoiceId,
      description: membershipInvoiceItem.description,
      quantity: membershipInvoiceItem.quantity,
      unitPrice: membershipInvoiceItem.unitPrice,
    })
    .from(membershipInvoiceItem)
    .where(inArray(membershipInvoiceItem.invoiceId, invoiceIds))
    .orderBy(asc(membershipInvoiceItem.createdAt), asc(membershipInvoiceItem.id));

  const wanted = new Set(invoiceIds);
  const grouped = new Map<string, InvoiceClientRow["items"]>();
  for (const item of items) {
    if (!wanted.has(item.invoiceId)) continue;
    const list = grouped.get(item.invoiceId) ?? [];
    list.push({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    });
    grouped.set(item.invoiceId, list);
  }
  return grouped;
}

/**
 * Org-wide dues ledger: every invoice joined to its member and tier, with a
 * derived dashboard status. Filters/pagination apply to the derived rows.
 */
export async function listDuesLedger(
  query: DuesLedgerQuery = {},
): Promise<ListResult<DuesLedgerRow>> {
  const page = Math.max(query.page ?? 1, 1);
  const limit = Math.min(Math.max(query.limit ?? 50, 1), 100);
  const status = query.status ?? "all";
  const now = new Date();

  const invoices = await fetchInvoicesWithClientContext();

  let rows: DuesLedgerRow[] = invoices.map((invoice) => {
    const balanceMinor = toMinorUnits(invoice.totalAmount) - toMinorUnits(invoice.paidAmount);
    return {
      invoiceId: invoice.invoiceId,
      invoiceNumber: invoice.invoiceNumber,
      subscriptionId: invoice.subscriptionId,
      memberId: invoice.memberId,
      memberName: invoice.memberName,
      memberEmail: invoice.memberEmail,
      tierId: invoice.tierId,
      tierName: invoice.tierName,
      amount: invoice.totalAmount,
      paid: invoice.paidAmount,
      balance: toAmountString(balanceMinor),
      issuedAt: invoice.issuedAt,
      dueDate: invoice.dueDate,
      status: deriveDuesStatus(invoice, now),
    };
  });

  if (status !== "all") {
    rows = rows.filter((row) => row.status === status);
  }

  const total = rows.length;
  const start = (page - 1) * limit;
  return { rows: rows.slice(start, start + limit), total };
}

/** Invoices with member/tier context and line items, for the invoices page. */
export async function listInvoicesForClient(
  query: InvoiceClientQuery = {},
): Promise<ListResult<InvoiceClientRow>> {
  const page = Math.max(query.page ?? 1, 1);
  const limit = Math.min(Math.max(query.limit ?? 50, 1), 100);
  const status = query.status ?? "all";
  const now = new Date();

  const invoices = await fetchInvoicesWithClientContext(query.userId);
  const itemsByInvoice = await fetchItemsForInvoices(invoices.map((invoice) => invoice.invoiceId));

  let rows: InvoiceClientRow[] = invoices.map((invoice) => {
    const balanceMinor = toMinorUnits(invoice.totalAmount) - toMinorUnits(invoice.paidAmount);
    const uiStatus: InvoiceClientRow["status"] =
      invoice.status === "PAID"
        ? "paid"
        : invoice.status === "VOID"
          ? "cancelled"
          : invoice.dueDate !== null && invoice.dueDate.getTime() < now.getTime()
            ? "overdue"
            : "sent";
    return {
      invoiceId: invoice.invoiceId,
      invoiceNumber: invoice.invoiceNumber,
      subscriptionId: invoice.subscriptionId,
      memberId: invoice.memberId,
      memberName: invoice.memberName,
      memberEmail: invoice.memberEmail,
      tierId: invoice.tierId,
      tierName: invoice.tierName,
      amount: invoice.totalAmount,
      paid: invoice.paidAmount,
      balance: toAmountString(balanceMinor),
      issuedAt: invoice.issuedAt,
      dueDate: invoice.dueDate,
      status: uiStatus,
      items: itemsByInvoice.get(invoice.invoiceId) ?? [],
    };
  });

  if (status !== "all") {
    rows = rows.filter((row) => row.status === status);
  }

  const total = rows.length;
  const start = (page - 1) * limit;
  return { rows: rows.slice(start, start + limit), total };
}
