# Security Advisory Waivers

The waiver mechanism [`docs/supply-chain.md`](docs/supply-chain.md)
describes. Each entry is a specific advisory, on a specific package, with
the reachability analysis that justified not blocking on it, and an expiry
date — a waiver that never gets re-reviewed is how a temporary exception
becomes a permanent, unexamined one. Re-run `bun audit --prod` and redo the
reachability check for each entry before its expiry date; if the
dependency chain hasn't changed, re-date it, don't just delete the expiry.

An advisory NOT listed here is either not yet triaged (open, check
`bun audit --prod`) or was deliberately left unwaived because reachability
couldn't be confidently ruled out — see `docs/supply-chain.md`'s triage
section for `ajv`/`fast-uri`/`defu`/`sharp`, none of which are waived.

## Waived

### GHSA-677m-j7p3-52f9 — socket.io-parser: unbounded binary attachments

- **Package / chain**: `socket.io-parser`, via `react-email › socket.io`
- **Waived**: 2026-07-26 — **Expires**: 2026-10-24
- **Reachability**: `react-email` is a devDependency (email template
  authoring/preview tool); this app sends email via `nodemailer`/`resend`
  (`src/lib/auth.ts`), never through `react-email`'s dev server or its
  `socket.io` dependency. Not present in the deployed runtime.

### GHSA-58qx-3vcg-4xpx / GHSA-96hv-2xvq-fx4p — ws: memory disclosure / DoS

- **Package / chain**: `ws`, via `react-email › socket.io › socket.io-adapter`
- **Waived**: 2026-07-26 — **Expires**: 2026-10-24
- **Reachability**: same as above — `react-email`'s dev-only `socket.io`
  chain, not part of the deployed app.

### GHSA-r635-g3xr-vw7x — engine.io: polling transport connection exhaustion

- **Package / chain**: `engine.io`, via `react-email › socket.io`
- **Waived**: 2026-07-26 — **Expires**: 2026-10-24
- **Reachability**: same as above.

### GHSA-3ppc-4f35-3m26 / GHSA-7r86-cg39-jmmj / GHSA-23c5-xmqv-rm74 — minimatch: ReDoS

- **Package / chain**: `minimatch`, via `react-email › glob` and
  `shadcn › ts-morph › @ts-morph/common`
- **Waived**: 2026-07-26 — **Expires**: 2026-10-24
- **Reachability**: both chains are dev-only tooling (`react-email`'s
  build step, `shadcn`'s CLI code generator). Neither runs in the deployed
  app or processes attacker-controlled input in this repo's usage —
  `shadcn` is invoked manually by a developer, not by a request handler.

### GHSA-67mh-4wv8-2f99 — esbuild: dev server request forwarding

- **Package / chain**: `esbuild`, via `drizzle-kit` and `react-email`
- **Waived**: 2026-07-26 — **Expires**: 2026-10-24
- **Reachability**: the advisory is specifically about `esbuild`'s own
  development server accepting arbitrary requests. `drizzle-kit` and
  `react-email` are CLI/dev tools run manually, never as a long-lived
  server process in this app's deployment.

### GHSA-qx2v-qp2m-jg93 / GHSA-6g55-p6wh-862q / GHSA-r28c-9q8g-f849 — postcss: CSS-comment-triggered XSS / file read / path traversal

- **Package / chain**: `postcss`, via `@tailwindcss/postcss`, `next`,
  `shadcn`
- **Waived**: 2026-07-26 — **Expires**: 2026-10-24
- **Reachability**: all three require PostCSS to process
  attacker-influenced CSS source (via a malicious `sourceMappingURL`
  comment or stylesheet content) at the time it runs. PostCSS only runs
  during `next build`'s CSS pipeline against this repo's own committed
  source files — no user input reaches it at runtime, and the deployed
  app never re-invokes PostCSS after build.

### GHSA-38f7-945m-qr2g — effect: AsyncLocalStorage context loss under concurrent RPC

- **Package / chain**: `effect`, via `better-auth › @prisma/client › prisma › @prisma/config`
  and `drizzle-orm`'s equivalent optional `@prisma/client` peer chain
- **Waived**: 2026-07-26 — **Expires**: 2026-10-24
- **Reachability**: Prisma is fully removed from this codebase
  ([ADR-0011](docs/adr/0011-prisma-to-drizzle.md)) — `@prisma/client` is an
  optional peer dependency of both `better-auth` and `drizzle-orm` that
  resolves in the install tree but is never imported or executed by
  anything in `src/`. Re-check this waiver if either package's optional
  Prisma integration is ever actually enabled.
