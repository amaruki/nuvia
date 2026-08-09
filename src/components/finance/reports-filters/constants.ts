import type { FilterOption } from "./types";

export const reportTypes: FilterOption[] = [
  { value: "income_statement", label: "Income Statement" },
  { value: "balance_sheet", label: "Balance Sheet" },
  { value: "cash_flow", label: "Cash Flow" },
  { value: "budget_vs_actual", label: "Budget vs Actual" },
  { value: "tax_document", label: "Tax Document" },
  { value: "audit_trail", label: "Audit Trail" },
];

export const reportStatuses: FilterOption[] = [
  { value: "draft", label: "Draft" },
  { value: "pending_review", label: "Pending Review" },
  { value: "approved", label: "Approved" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

export const reportPeriods: FilterOption[] = [
  { value: "Q1 2024", label: "Q1 2024" },
  { value: "Q2 2024", label: "Q2 2024" },
  { value: "Q3 2024", label: "Q3 2024" },
  { value: "Q4 2024", label: "Q4 2024" },
  { value: "FY 2023", label: "FY 2023" },
  { value: "FY 2024", label: "FY 2024" },
];

export const generatedByOptions: FilterOption[] = [
  { value: "John Smith", label: "John Smith" },
  { value: "Emily Chen", label: "Emily Chen" },
  { value: "David Wilson", label: "David Wilson" },
  { value: "Robert Taylor", label: "Robert Taylor" },
  { value: "William Garcia", label: "William Garcia" },
  { value: "James Thompson", label: "James Thompson" },
  { value: "Mary White", label: "Mary White" },
  { value: "Christopher Lee", label: "Christopher Lee" },
];

export const commonTags: string[] = [
  "quarterly",
  "annual",
  "monthly",
  "income",
  "expense",
  "budget",
  "tax",
  "audit",
  "2023",
  "2024",
  "draft",
  "published",
];
