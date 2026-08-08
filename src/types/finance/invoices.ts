// Invoice related types
export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientAddress?: string;
  items: InvoiceItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled" | "refunded";
  issueDate: Date;
  dueDate: Date;
  paidDate?: Date;
  paidAmount?: number;
  paymentMethod?: string;
  transactionId?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  category?: string;
  serviceType?: string;
}

export interface InvoicePayment {
  id: string;
  invoiceId: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: string;
  transactionId: string;
  status: "completed" | "pending" | "failed" | "refunded";
  processedBy: string;
  notes?: string;
  createdAt: Date;
}

export interface InvoiceStatistics {
  totalInvoices: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  collectionRate: number;
  overdueCount: number;
  upcomingInvoices: number;
  monthlyTrend: Array<{
    month: string;
    amount: number;
    collected: number;
  }>;
  clientBreakdown: Array<{
    clientId: string;
    clientName: string;
    invoiceCount: number;
    totalAmount: number;
    paidAmount: number;
  }>;
}

export interface InvoiceFilterOptions {
  status?: string[];
  client?: string[];
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

export interface InvoiceFormData {
  clientId: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    category?: string;
    serviceType?: string;
  }>;
  issueDate: Date;
  dueDate: Date;
  notes?: string;
  currency?: string;
}
