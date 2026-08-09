/**
 * Re-export shim — the dashboard overview service lives in
 * ./dashboard-overview/. This file keeps the historical flat
 * `@/lib/services/<name>.service` specifier convention (see the sibling
 * finance-report.service.ts shim).
 */

export * from "./dashboard-overview";
