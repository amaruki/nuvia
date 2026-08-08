// Financial Reports related types
export interface FinancialReport {
  id: string;
  title: string;
  description: string;
  type:
    | "income_statement"
    | "balance_sheet"
    | "cash_flow"
    | "budget_vs_actual"
    | "tax_document"
    | "audit_trail";
  period: string;
  startDate: Date;
  endDate: Date;
  status: "draft" | "pending_review" | "approved" | "published" | "archived";
  generatedBy: string;
  generatedAt: Date;
  reviewedBy?: string;
  reviewedAt?: Date;
  publishedAt?: Date;
  fileUrl?: string;
  fileSize?: number;
  downloadCount: number;
  tags: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportSection {
  id: string;
  reportId: string;
  title: string;
  order: number;
  type: "table" | "chart" | "text" | "summary";
  content: any; // Dynamic content based on type
  createdAt: Date;
}

export interface ReportStatistics {
  totalReports: number;
  publishedReports: number;
  draftReports: number;
  pendingReviewReports: number;
  archivedReports: number;
  totalDownloads: number;
  reportsByType: Array<{
    type: string;
    count: number;
    downloads: number;
  }>;
  reportsByPeriod: Array<{
    period: string;
    count: number;
    downloads: number;
  }>;
  recentActivity: Array<{
    reportId: string;
    reportTitle: string;
    action: string;
    performedBy: string;
    performedAt: Date;
  }>;
  monthlyTrend: Array<{
    month: string;
    generated: number;
    downloaded: number;
  }>;
}

export interface ReportFilterOptions {
  type?: string[];
  status?: string[];
  period?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  generatedBy?: string[];
  tags?: string[];
  search?: string;
}

export interface ReportFormData {
  title: string;
  description: string;
  type:
    | "income_statement"
    | "balance_sheet"
    | "cash_flow"
    | "budget_vs_actual"
    | "tax_document"
    | "audit_trail";
  period: string;
  startDate: Date;
  endDate: Date;
  tags: string[];
  notes?: string;
}
