# Security Advisory Waivers

[`docs/supply-chain.md`](docs/supply-chain.md) describes the waiver mechanism used here. Each entry names a specific advisory and a specific package. It records the reachability analysis that explains why the advisory did not require a block, and it lists an expiry date. A waiver that is never reviewed again becomes a permanent, unexamined exception instead of a temporary one. Re-run `bun audit --prod` and redo the reachability check for each entry before its expiry date. If the dependency chain has not changed, give it a new date. Do not just delete the expiry date.

An advisory not listed here has one of two states. Either it is not yet triaged (check `bun audit --prod` for open advisories), or the maintainers deliberately left it unwaived because reachability could not be confidently ruled out. See `docs/supply-chain.md`'s triage section for `sharp`, which is not waived. The `ajv`, `fast-uri`, `defu`, and `effect` production advisories are no longer waived: they are fixed by the version floors in `package.json`'s `overrides` (issue #4), which is the preferred outcome over a waiver.

## Waived

### GHSA-677m-j7p3-52f9 — socket.io-parser: unbounded binary attachments

- **Package / chain**: `socket.io-parser`, via `react-email › socket.io`
- **Waived**: 2026-07-26 — **Expires**: 2026-10-24
- **Reachability**: `react-email` is a devDependency (an email template authoring and preview tool). This app sends email through `nodemailer` or `resend` (see `src/lib/auth.ts`), never through `react-email`'s dev server or its `socket.io` dependency. This dependency chain is not present in the deployed runtime.

### GHSA-58qx-3vcg-4xpx / GHSA-96hv-2xvq-fx4p — ws: memory disclosure / DoS

- **Package / chain**: `ws`, via `react-email › socket.io › socket.io-adapter`
- **Waived**: 2026-07-26 — **Expires**: 2026-10-24
- **Reachability**: this is the same as the socket.io-parser entry above. It is `react-email`'s dev-only `socket.io` chain, and it is not part of the deployed app.

### GHSA-r635-g3xr-vw7x — engine.io: polling transport connection exhaustion

- **Package / chain**: `engine.io`, via `react-email › socket.io`
- **Waived**: 2026-07-26 — **Expires**: 2026-10-24
- **Reachability**: this is the same as the socket.io-parser entry above.

### GHSA-3ppc-4f35-3m26 / GHSA-7r86-cg39-jmmj / GHSA-23c5-xmqv-rm74 — minimatch: ReDoS

- **Package / chain**: `minimatch`, via `react-email › glob` and `shadcn › ts-morph › @ts-morph/common`
- **Waived**: 2026-07-26 — **Expires**: 2026-10-24
- **Reachability**: both chains are dev-only tooling: `react-email`'s build step and `shadcn`'s CLI code generator. Neither runs in the deployed app, and neither processes attacker-controlled input in this repo's usage. A developer invokes `shadcn` manually. A request handler never invokes it.

### GHSA-67mh-4wv8-2f99 — esbuild: dev server request forwarding

- **Package / chain**: `esbuild`, via `drizzle-kit` and `react-email`
- **Waived**: 2026-07-26 — **Expires**: 2026-10-24
- **Reachability**: the advisory is specifically about `esbuild`'s own development server, which accepts arbitrary requests. `drizzle-kit` and `react-email` are CLI and development tools that a developer runs manually. Neither runs as a long-lived server process in this app's deployment.

### GHSA-qx2v-qp2m-jg93 / GHSA-6g55-p6wh-862q / GHSA-r28c-9q8g-f849 — postcss: CSS-comment-triggered XSS / file read / path traversal

- **Package / chain**: `postcss`, via `@tailwindcss/postcss`, `next`, `shadcn`
- **Waived**: 2026-07-26 — **Expires**: 2026-10-24
- **Reachability**: all three advisories require PostCSS to process attacker-influenced CSS source, through a malicious `sourceMappingURL` comment or malicious stylesheet content, at the time it runs. PostCSS runs only during `next build`'s CSS pipeline, against this repo's own committed source files. No user input reaches PostCSS at runtime. The deployed app never runs PostCSS again after build.

### GHSA-38f7-945m-qr2g — effect: AsyncLocalStorage context loss under concurrent RPC

- **Package / chain**: `effect`, via `better-auth › @prisma/client › prisma › @prisma/config`, `drizzle-orm`'s equivalent optional `@prisma/client` peer chain, and `@hookform/resolvers`' optional `effect` peer
- **Waived**: 2026-07-26 — **Expires**: 2026-10-24
- **Status**: also pinned to a fixed version by the `effect` floor in `package.json`'s `overrides` (issue #4), so this advisory does not currently appear in `bun audit --prod`. The waiver stays as a fallback in case the override is removed while upstream still pins a vulnerable version.
- **Reachability**: Prisma is fully removed from this codebase ([ADR-0011](docs/adr/0011-prisma-to-drizzle.md)). `@prisma/client` is an optional peer dependency of both `better-auth` and `drizzle-orm`, and `effect` is an optional peer of `@hookform/resolvers` (only the zod resolver is used here). These edges resolve in the install tree, but nothing in `src/` imports or executes `effect`. Re-check this waiver if any package's optional integration is ever actually enabled.
