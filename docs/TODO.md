# TODO

Follow-ups from the finance tables DataTable migration
(`docs/plans/2026-07-23-finance-tables-plan.md`, D7). None of these blocks the
shipped tables; each is logged here instead of being papered over in the UI.

## Finance tables follow-ups

- **Server-side search and filters for invoices and dues.** The report
  endpoints (`GET /api/v1/finance/reports/invoices`, `/api/v1/finance/reports/dues`)
  accept only `page`/`limit`: no search, status, or date params. The toolbar
  search therefore filters the loaded page client-side (stated in both table
  components), which is honest but limited to the visible page. Add
  server-side `q` plus status/date params to both endpoints, then wire
  `DataTableSearch` (and any faceted filters) to the query instead of the
  loaded page. The removed client-side filter panels
  (`invoices-filters.tsx`/`dues-filters.tsx`) come back only on top of that.
  The donations and budget tables have the same client-side-search shape over
  their paginated endpoints.
- **Per-invoice payment fetch.** The invoice and due details modals derive
  payment history by filtering the shared recent-payments window
  (`PAYMENTS_RECENT_LIMIT = 100` in both finance hook `constants.ts` files) by
  `invoiceId`/`dueId`, so payments older than the newest 100 never appear.
  Fetch per-invoice history instead — `GET /api/v1/finance/payments` already
  accepts an `invoiceId` filter.
