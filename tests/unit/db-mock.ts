/**
 * The sanctioned DB boundary for unit tests (CODING_STANDARD.md §6): when a
 * unit test needs a service that touches data, mock `@/db/client` — never
 * the service itself, and never a live connection.
 *
 * Usage pattern (register BEFORE importing the module under test):
 *
 *   import { mockDbClient, restoreDbClient } from "./db-mock";
 *   mockDbClient(stubDb);
 *   // Dynamic import is the intentional module-loading-boundary exception
 *   // here: the mock must be registered before the module under test is
 *   // loaded, so a static import cannot work.
 *   const { myService } = await import("@/lib/services/my-service");
 *   // …assert…
 *   restoreDbClient(); // in afterAll
 *
 * Isolation rules — read before adding a second user of this helper:
 *  - `mock.module` rewrites the module registry of the ENTIRE test process,
 *    not of one file. Bun runs every file of a `bun test` invocation in one
 *    process, with files executing concurrently, so a registered mock is
 *    visible to every file in the same run. This was proven the hard way:
 *    a transient sentinel here corrupted concurrent integration tests with
 *    `db.insert is not a function`.
 *  - Therefore this helper is safe ONLY under `bun run test:unit`, where no
 *    other file touches the real database, and at most ONE file may hold the
 *    db mock at a time (concurrent files would race over the registry).
 *    Never hold a db mock during a full `bun test` run (integration + unit
 *    together): integration files import `@/db/client` and would receive the
 *    stub.
 *  - `mock.restore()` only resets function mocks (`mock()`/`spyOn()`), not
 *    module mocks — that is why restoreDbClient() exists and must be called
 *    explicitly (afterAll) to shrink the mock window.
 *  - Mocks of leaf modules that only the mocking file imports (e.g. the
 *    use-session/next/navigation stubs in sidebar-correctness.test.ts) do
 *    not need this discipline, because no other file resolves them.
 */
import { mock } from "bun:test";

import * as realDbClient from "@/db/client";

/** Replace `db` as seen by every importer of `@/db/client` in this run. */
export function mockDbClient(dbStub: unknown): void {
  mock.module("@/db/client", () => ({ ...realDbClient, db: dbStub }));
}

/** Undo mockDbClient (module mocks are not covered by mock.restore()). */
export function restoreDbClient(): void {
  mock.module("@/db/client", () => ({ ...realDbClient }));
}
