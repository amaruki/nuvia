/**
 * Finance dashboard reporting — C4.
 *
 * Read-only computations over the membership finance tables that C2/C3
 * landed (tiers, subscriptions, invoices, payments, transactions). Nothing
 * here writes, and nothing here changes C2/C3 service behavior — the
 * dashboard pages read these aggregates instead of the mock data they
 * shipped with.
 *
 * Money rules follow docs/adr/0015-payment-gateway-adapter-stripe-first.md
 * §5: numeric(10,2) columns travel as strings; sums use exact integer
 * minor-unit arithmetic via toMinorUnits/toAmountString, never floats.
 *
 * There are deliberately NO budget or donation aggregates here: the schema
 * has no budget/donation tables, and the dashboard must not pretend
 * otherwise (those pages render honest empty states instead).
 *
 * Split from src/lib/services/finance-report.service.ts, which stays as a
 * re-export shim so `@/lib/services/finance-report.service` keeps
 * resolving.
 */

export type {
  ConfiguredGatewayStatus,
  DuesLedgerQuery,
  DuesLedgerRow,
  DuesUiStatus,
  FinanceReportSummary,
  InvoiceClientQuery,
  InvoiceClientRow,
  ListResult,
  OutstandingSummary,
  RevenueByTierRow,
  RevenuePeriodRow,
} from "./types";
export {
  getFinanceReportSummary,
  getOutstandingSummary,
  getRevenueByPeriod,
  getRevenueByTier,
} from "./revenue";
export { listDuesLedger, listInvoicesForClient } from "./ledger";
export { describeConfiguredGateway } from "./gateway";
