import type { Donation, DonationStatistics } from "@/types/finance";

// ---------------------------------------------------------------------------
// Wire shapes (ISO dates, decimal strings) returned by the finance API
// ---------------------------------------------------------------------------

/** Wire shape of the donations rows returned by /finance/donations. */
export interface DonationWireRow {
  id: string;
  donorName: string;
  donorEmail: string;
  donorType: Donation["donorType"];
  donationType: Donation["donationType"];
  campaign: string | null;
  amount: string;
  currency: string;
  status: Donation["status"];
  paymentMethod: string | null;
  transactionId: string | null;
  donationDate: string;
  receiptSent: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

/** POST /finance/donations body (decimal-string amount, ISO date). */
export interface DonationCreatePayload {
  donorName: string;
  donorEmail: string;
  donorType: Donation["donorType"];
  donationType: Donation["donationType"];
  campaign?: string;
  amount: string;
  currency?: string;
  status?: Donation["status"];
  paymentMethod?: string;
  transactionId?: string;
  donationDate?: string;
  receiptSent?: boolean;
  notes?: string;
}

/** PATCH /finance/donations/:id body — the mutable fields only. */
export interface DonationUpdatePayload {
  status?: Donation["status"];
  notes?: string | null;
  receiptSent?: boolean;
  campaign?: string | null;
}

// ---------------------------------------------------------------------------
// Hook contract
// ---------------------------------------------------------------------------

export interface UseFinanceDonationsOptions {
  /** 1-based page of the donations table. */
  page: number;
  /** Rows per page requested from the list endpoint. */
  pageSize: number;
}

export interface UseFinanceDonationsReturn {
  // Table data (one server-paginated page)
  donations: Donation[];
  total: number;
  totalPages: number;
  /** Initial load gate for the whole page. */
  loading: boolean;
  /** True while a table page/refetch is in flight (skeleton rows). */
  fetching: boolean;
  error: string | null;

  // Aggregate window (newest STATISTICS_WINDOW_LIMIT rows, documented cap)
  statisticsRows: Donation[];
  statistics: DonationStatistics;

  // Actions — mutations stay toast-free; callers surface feedback.
  createDonation: (input: DonationCreatePayload) => Promise<void>;
  updateDonation: (id: string, input: DonationUpdatePayload) => Promise<void>;
  updateDonationStatus: (donationId: string, status: Donation["status"]) => void;
  refreshData: () => void;
}
