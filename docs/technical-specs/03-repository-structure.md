# 3. Repository Structure

```
src/
├── app/                     # Next.js App Router — pages and API routes
│   ├── (public)/            # Real route group: no session required
│   ├── dashboard/           # Plain directory, role-gated by proxy.ts (see Section 2.4)
│   ├── api/v1/               # Versioned API routes, requirePermission-gated per route
│   └── auth/                # Login, signup, OAuth callback pages
├── db/
│   ├── schema/               # Drizzle table definitions, one file per bounded area
│   └── client.ts             # Drizzle client (drizzle-orm/bun-sql)
├── lib/
│   ├── services/             # Business logic (route.ts -> service -> Drizzle)
│   ├── validation/            # Zod schemas, one file per domain
│   ├── auth/                  # better-auth config, session/middleware helpers
│   ├── rbac.ts                 # requirePermission / requireRole (ADR-0001)
│   ├── http.ts                  # RFC 9457 problemResponse / successResponse (ADR-0002)
│   ├── rate-limit.ts             # Redis-backed rate limiter (ADR-0003)
│   ├── logger.ts                  # Structured logger (ADR-0004)
│   ├── navigation-data.ts          # Path/role nav data, read by both the sidebar and dashboard-access.ts
│   ├── dashboard-access.ts          # isRoleAllowedForPath, the dashboard's server-side role gate
│   └── env.ts                        # Validated environment config — import this, not process.env
├── components/                        # React components
├── types/                              # TypeScript type definitions (role.types.ts, dashboard.types.ts)
└── proxy.ts                             # Next.js 16's middleware.ts replacement (network-boundary auth)
```

This is single-package, not a monorepo: one `package.json`, one Next.js application, no `workspaces` field. There is no shared-code package to publish or version separately, because there is only one consumer of every module.
