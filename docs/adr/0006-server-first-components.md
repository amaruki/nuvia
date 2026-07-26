# ADR-0006: Server-first components

**Status:** Accepted, not yet implemented (tracked in `TODO.md`, post-M2)

## Context

234 of 303 `.tsx` files (77%) open with `"use client"`. The App Router is
being used as if it were a client-side SPA shell: `src/app/dashboard/layout.tsx`
itself is a client component, which is also _why_ it performs no
server-side session check (a client component can't read the session
without a round trip) — a direct contributor to the authorization gaps in
`TODO.md` M1.

## Decision

Default to Server Components. A component gets `"use client"` only when it
genuinely needs one of: browser-only APIs, interactive state
(`useState`/`useEffect` driving UI, not data fetching), or a
context/hook that requires the client runtime (`react-hook-form`,
`next-themes`, etc.). Data fetching, layout composition, and anything that
can render from props alone stays a Server Component.

`src/app/dashboard/layout.tsx` becomes a Server Component that performs the
`requirePermission`/session check directly (ADR-0001, ADR-0005) and passes
the resolved user down; interactive pieces (the sidebar's collapse state,
etc.) move into small, leaf-level client components.

## Consequences

- This is a large, incremental migration, not a single PR — module
  promotion (`docs/adr/0008-module-maturity-gate.md`) is a natural forcing
  function, since each promoted module gets rebuilt against real data
  anyway.
- `oxlint`'s `nextjs` rule set flags new files that default to `"use
client"` without an apparent reason, as a nudge rather than a hard block
  (a false positive here is cheap; a missed one just means business as
  usual until the next pass).
- Bundle size and first-load performance — the "fast" principle in
  `docs/PRINCIPLES.md` — improve as a side effect, not the primary
  motivation; the primary motivation is that Server Components are what
  make the auth-gate fix in `TODO.md` M1 possible in the first place.
