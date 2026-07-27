# ADR-0006: Server-first components

**Status:** Accepted, not yet implemented (tracked in `TODO.md`, post-M2)

## Context

234 of 303 `.tsx` files (77%) open with `"use client"`. Developers use the App Router as if it were a client-side SPA shell. `src/app/dashboard/layout.tsx` itself is a client component. This is also _why_ it performs no server-side session check — a client component cannot read the session without a round trip. This gap is a direct contributor to the authorization gaps in `TODO.md` M1.

## Decision

Default to Server Components. A component gets `"use client"` only when it genuinely needs one of the following:

- Browser-only APIs.
- Interactive state that drives UI, not data fetching (for example, `useState` or `useEffect`).
- A context or hook that requires the client runtime (for example, `react-hook-form` or `next-themes`).

Data fetching, layout composition, and anything that can render from props alone remain Server Components.

`src/app/dashboard/layout.tsx` becomes a Server Component that performs the `requirePermission`/session check directly (ADR-0001, ADR-0005) and passes the resolved user down. Interactive pieces (for example, the sidebar's collapse state) move into small, leaf-level client components.

## Consequences

- This is a large, incremental migration, not a single PR. Module promotion (`docs/adr/0008-module-maturity-gate.md`) is a natural forcing function for it, since the team rebuilds each promoted module against real data anyway.
- `oxlint`'s `nextjs` rule set flags new files that default to `"use client"` without an apparent reason. This acts as a nudge, not a hard block. A false positive here is cheap. A missed one just means business as usual until the next pass.
- Bundle size and first-load performance — the "fast" principle in `docs/PRINCIPLES.md` — improve as a side effect, not as the primary motivation. The primary motivation is that Server Components make the auth-gate fix in `TODO.md` M1 possible in the first place.
