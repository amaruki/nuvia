# Finance tables — DataTable adoption, server pagination, honest affordances

## Decisions

### D1 — Invoices/dues hooks: table query + aggregate window

Each hook gets two list queries against the existing endpoints (no API changes needed —
`page`/`limit` already exist):

- **Table query** `GET /api/v1/finance/reports/{invoices,dues}?page=&limit=` keyed by
  `{page, pageSize}` → rows + `meta.total`/`meta.totalPages`. Feeds the DataTable. Silent
  `limit=100` cap removed.
- **Aggregate window query**: same endpoint, `page=1&limit=100`, documented constant
  (`STATISTICS_WINDOW_LIMIT`). `buildInvoiceStatistics`/`buildDueStatistics`, Recent/Upcoming
  cards, and Status Breakdown are computed from this window with a code comment stating the
  cap ("aggregate views describe the 100 most recent rows; the table itself paginates fully").
  Behavior identical to today, but no longer silent.
- ActionBar "N total" switches to `meta.total` (true server count — more honest than today).
- Payments queries keep `limit=100`, renamed to `PAYMENTS_RECENT_LIMIT` with a stating comment
  (recent-payments window for PaymentsTab + details modals; not one of the 5 tables).

### D2 — Remove client-side filter panels (invoices + dues pages)

`InvoicesFilters`/`DuesFilters` filtered a capped in-memory list; under server pagination they
would silently filter a single page, and the API has no params for date/amount/client/search.
Delete the panels, `applyInvoiceFilters`/`applyDueFilters`, and hook filter state. Replace with
DataTable-native toolbar: `DataTableSearch` (URL `?q=`, client-side over the loaded page — API
has no search param, stated in comment) + `DataTableViewOptions`. ActionBar loses the Filters
toggle; keeps total + overdue badge + Refresh. Server-side filtering logged to docs/TODO.md.

### D3 — Table rewrites (all five on DataTable)

- **invoices-table**: columns Invoice # / Client / Amount / Paid / Balance / Due Date / Status /
  Actions. Money right-aligned `tabular-nums`; Due Date = absolute + `formatDistanceToNow` in
  `title`; status via existing Badge-variant badge; row click → details; kebab menu extracted to
  `invoice-actions-menu.tsx` with aria-label. Delete `invoice-row.tsx` + `invoice-card.tsx`
  (mobile card fallback replaced by scrollable DataTable). Toolbar: search + view options.
  `DataTablePagination` wired to URL state + server meta.
- **dues-table**: same pattern; columns Member / Tier / Due / Paid / Balance / Due Date / Status /
  Actions (existing `DueActionsMenu`, add trigger aria-label). Delete `due-row.tsx`.
- **donations-table** (no API): client-mode DataTable — `useDataTableState`, local
  filter+sort+slice (demo pattern: `manualSorting`/`manualFiltering` + controlled state).
  Donor-type emoji glyphs (👤🏢🎭) AND donation-type glyphs (💵🔄🤝) → lucide icons
  (User/Building2/Incognito, Banknote/Repeat/Handshake) with aria-labels (UI-13 item).
  Remove handler-less "Download Receipt" menu item (no receipt-download service exists).
  Drop orphaned `payments` prop / modal dependency.
- **gateways-table** (no API): same client-mode pattern. Columns Gateway / Provider /
  Environment / Transactions / Volume / Success Rate / Enabled (Switch) / Actions; volume
  right-aligned `tabular-nums`; `lastTestedAt` relative text gets absolute `title`.
- **budget-transaction-table** (no API): same client-mode pattern. Columns Date / Description /
  Type / Amount / Status / Vendor / Actions; amount right-aligned `tabular-nums` with sign
  color; date absolute + relative `title`. Handler-less "View Receipt" item wired to open the
  real `receiptUrl`.
- All kebab triggers get accessible names (UI-08). No `@/components/ui/table` imports remain in
  the five tables.

### D4 — Payment amount validation (invoices + dues PaymentDialog)

New helper per folder `validatePaymentAmount(raw, balance) → string | null`: rejects empty/NaN,
<= 0, > 2 decimal places, > outstanding balance. Dialog renders the error (`role="alert"`) and
disables submit. Invoice creation itself is server-side (zod on POST /finance/invoices); the
payment dialogs are the only amount inputs in this surface — noted in report.

### D5 — Pages

`invoices/page.tsx` + `dues/page.tsx`: own `useDataTableState({ defaultPageSize: 20 })`, pass
`{page, pageSize}` to hooks, clamp stale URL pages (`min(state.page, totalPages)`), pass rows +
meta + state/setters to tables; Overview/Analytics tabs receive aggregate-window rows.
Donations/budget/gateways pages unchanged (empty states / single-gateway card stay honest).

### D6 — Tests: `tests/tables-finance.test.ts` (red first)

Structural source-scan (readFileSync + regex, no React execution), asserting: five tables use
DataTable (no raw ui/table), invoices+dues pages use `useDataTableState`, `tabular-nums` +
`text-right` in all five, date `title` tooltips, donations emoji-free + aria-labels + lucide,
no "Download Receipt"/fake Export, queries interpolate `page=`/`limit=`, window cap stated,
payment validation present, dead files gone.

### D7 — Hygiene

Delete dead files (invoice-row/card, due-row, filter panels, filter fns). `bun run typecheck`,
`bun run lint`, `bun run format` then `format:check`; `bun test tests/tables-finance.test.ts`
plus existing related suites (data-table-layer, member-finance). docs/TODO.md created with
follow-ups (server-side search/filters, donation module wiring, per-invoice payment fetch).

## File list

- NEW: tests/tables-finance.test.ts, docs/TODO.md, invoices-table/invoice-actions-menu.tsx
- MODIFY hooks: use-finance-invoices/{constants,types,use-invoice-queries,index}.ts,
  use-finance-dues/{constants,types,use-due-queries,index}.ts
- MODIFY tables: invoices-table/{index,types,helpers,payment-dialog,use-invoices-table-state}.tsx/ts,
  dues-table/{dues-table,types,helpers,payment-dialog,due-actions-menu}.tsx/ts,
  donations-table.tsx, gateways-table.tsx, budget-transaction-table.tsx,
  donation-details-modal/actions.tsx
- MODIFY pages: invoices/page.tsx, invoices/_components/action-bar.tsx, dues/page.tsx,
  dues/_components/dues-action-bar.tsx
- DELETE: invoices-table/{invoice-row,invoice-card}.tsx, dues-table/due-row.tsx,
  invoices-filters.tsx, dues-filters.tsx, use-finance-invoices/invoice-filters.ts,
  use-finance-dues/due-filters.ts

## Out of scope / report notes

- API routes untouched (pagination params already present).
- PaymentsTab recent list + modal payment history keep a stated 100-row window.
- Mobile card fallbacks dropped in favor of scrollable DataTable.
