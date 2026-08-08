// Member Dues related types
export interface MemberDue {
  id: string;
  memberId: string;
  memberName: string;
  memberEmail: string;
  membershipTier: string;
  dueAmount: number;
  paidAmount: number;
  balanceAmount: number;
  dueDate: Date;
  paidDate?: Date;
  status: "pending" | "paid" | "overdue" | "partial" | "cancelled";
  paymentMethod?: string;
  transactionId?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DuePayment {
  id: string;
  dueId: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: string;
  transactionId: string;
  status: "completed" | "pending" | "failed" | "refunded";
  processedBy: string;
  notes?: string;
  createdAt: Date;
}

export interface DueReminder {
  id: string;
  dueId: string;
  reminderType: "email" | "sms" | "in_app";
  scheduledDate: Date;
  sentDate?: Date;
  status: "scheduled" | "sent" | "failed";
  template: string;
  recipient: string;
  createdAt: Date;
}

export interface DueStatistics {
  totalDues: number;
  totalAmount: number;
  collectedAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  collectionRate: number;
  overdueCount: number;
  upcomingDues: number;
  monthlyTrend: Array<{
    month: string;
    amount: number;
    collected: number;
  }>;
  tierBreakdown: Array<{
    tier: string;
    count: number;
    amount: number;
    collected: number;
  }>;
}

export interface DueFilterOptions {
  status?: string[];
  tier?: string[];
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

export interface DueFormData {
  memberId: string;
  membershipTier: string;
  dueAmount: number;
  dueDate: Date;
  notes?: string;
}
