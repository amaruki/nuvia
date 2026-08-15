# TODO

Follow-ups from the finance tables DataTable migration
(`docs/plans/2026-07-23-finance-tables-plan.md`, D7). None of these blocks the
shipped tables; each is logged here instead of being papered over in the UI.

## Finance tables follow-ups

- **Server-side search and filters for invoices and dues.** The report
  endpoints (`GET /api/v1/finance/reports/invoices`, `/api/v1/finance/reports/dues`)
  accept only `page`/`limit` — no search, status, or date params — so the
  DataTable toolbar search on both pages currently has nothing to drive (the
  tables run with `manualFiltering`, and the queries send only `page`/`pageSize`).
  Add server-side `q` plus status/date params to both endpoints, then wire
  `DataTableSearch` (and any faceted filters) to the query instead of the
  loaded page. The removed client-side filter panels
  (`invoices-filters.tsx`/`dues-filters.tsx`) come back only on top of that.
- **Donation module wiring (real API).** `src/components/finance/donations-table.tsx`
  is a client-mode DataTable with no backing store: the schema has no donation
  or campaign tables, and `/dashboard/finance/donations` renders an honest
  empty state. When a donation store lands (schema + authorized API + tests),
  wire the table and the donations page to it and drop the demo-mode props.
- **Per-invoice payment fetch.** The invoice and due details modals derive
  payment history by filtering the shared recent-payments window
  (`PAYMENTS_RECENT_LIMIT = 100` in both finance hook `constants.ts` files) by
  `invoiceId`/`dueId`, so payments older than the newest 100 never appear.
  Fetch per-invoice history instead — `GET /api/v1/finance/payments` already
  accepts an `invoiceId` filter.
