/**
 * Member-scoped finance projections (UI-34).
 *
 * Every shape here is an ALLOW-LIST: members only ever see these fields of
 * their OWN invoices. Internal columns (metadata, tierId, subscriptionId,
 * audit fields) never cross the member boundary. Amounts stay
 * numeric(10,2) string mode end to end (ADR-0015 §5).
 */

export type InvoiceStatusDto = "ISSUED" | "PAID" | "VOID";

/** One row of the member's invoice history. */
export interface MemberInvoiceDto {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatusDto;
  currency: string;
  subtotal: string;
  taxAmount: string;
  totalAmount: string;
  paidAmount: string;
  /** totalAmount - paidAmount, exact minor-unit math; "0.00" unless ISSUED. */
  outstandingAmount: string;
  tierName: string;
  dueDate: string | null;
  createdAt: string;
}

export interface MemberInvoiceItemDto {
  description: string;
  quantity: number;
  unitPrice: string;
  amount: string;
}

export interface MemberInvoiceDetailDto extends MemberInvoiceDto {
  items: MemberInvoiceItemDto[];
}

/** Outstanding-balance summary computed from the member's own invoices. */
export interface MemberFinanceSummary {
  /** Sum of outstanding balances over the member's own ISSUED invoices. */
  outstandingBalance: string;
  outstandingInvoiceCount: number;
  /** Everything the member has paid across all their invoices. */
  totalPaid: string;
  invoiceCounts: { issued: number; paid: number; void: number };
}

export interface MemberInvoiceQuery {
  status?: InvoiceStatusDto;
  page?: number;
  limit?: number;
}

export type MemberPayTrack = "stripe" | "manual";

/**
 * Pay-now result. The stripe track stays "pending" until the verified
 * webhook settles the ledger; the manual track is honest: nothing was
 * charged, nothing will settle on its own.
 */
export type MemberPayNowResult =
  | {
      track: "stripe";
      paymentStatus: "pending";
      invoiceId: string;
      checkoutUrl: string;
      providerTxId: string | null;
    }
  | {
      track: "manual";
      paymentStatus: "unpaid";
      invoiceId: string;
      checkoutUrl: null;
      providerTxId: null;
      guidance: readonly string[];
    };

export interface DonationAlternative {
  label: string;
  href: string;
}

/**
 * What the deployment can actually do about donations. `available` is a
 * literal false until a donation schema exists — the type itself prevents
 * a UI from pretending otherwise.
 */
export interface DonationCapability {
  available: false;
  reason: string;
  alternatives: DonationAlternative[];
}
