// Donation related types
export interface Donation {
  id: string;
  donorId: string;
  donorName: string;
  donorEmail: string;
  donorType: "individual" | "organization" | "anonymous";
  donationType: "one_time" | "recurring" | "pledge";
  campaign?: string;
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed" | "refunded" | "pledged";
  paymentMethod?: string;
  transactionId?: string;
  donationDate: Date;
  receiptSent: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DonationCampaign {
  id: string;
  name: string;
  description: string;
  goalAmount: number;
  raisedAmount: number;
  startDate: Date;
  endDate?: Date;
  status: "active" | "completed" | "cancelled" | "upcoming";
  category: string;
  featured: boolean;
  createdAt: Date;
}

export interface DonationPayment {
  id: string;
  donationId: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: string;
  transactionId: string;
  status: "completed" | "pending" | "failed" | "refunded";
  processedBy: string;
  notes?: string;
  createdAt: Date;
}

export interface DonationStatistics {
  totalDonations: number;
  totalAmount: number;
  completedAmount: number;
  pendingAmount: number;
  pledgedAmount: number;
  /** Completed donations dated in the current calendar month. */
  thisMonthAmount: number;
  averageDonation: number;
  donorCount: number;
  recurringDonorCount: number;
  monthlyTrend: Array<{
    month: string;
    amount: number;
    count: number;
  }>;
  campaignBreakdown: Array<{
    campaignId: string;
    campaignName: string;
    amount: number;
    count: number;
  }>;
  donorTypeBreakdown: Array<{
    donorType: string;
    amount: number;
    count: number;
  }>;
}

export interface DonationFilterOptions {
  status?: string[];
  donorType?: string[];
  donationType?: string[];
  campaign?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  amountRange?: {
    min: number;
    max: number;
  };
  search?: string;
}

export interface DonationFormData {
  donorId: string;
  donorType: "individual" | "organization" | "anonymous";
  donationType: "one_time" | "recurring" | "pledge";
  campaign?: string;
  amount: number;
  currency?: string;
  notes?: string;
  sendReceipt?: boolean;
  sendThankYou?: boolean;
}
