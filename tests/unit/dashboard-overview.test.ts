/**
 * Dashboard overview (UI-01) — unit side.
 *
 * Pure numeric helpers live here, in the infra-free suite. The aggregate
 * queries they feed (member/event/finance counts over the real database)
 * stay in tests/dashboard-overview-aggregates.test.ts, which needs the
 * compose stack.
 *
 * There is deliberately no live db-mock wiring test here: mock.module is
 * process-global, so registering a db stub during a full `bun test` run
 * corrupts concurrent integration files. The rules live in db-mock.ts.
 */
import { describe, expect, test } from "bun:test";

import { changePercent } from "@/lib/services/dashboard-overview.service";

describe("changePercent (pure helper)", () => {
  test("computes growth from minor-unit amounts", () => {
    expect(changePercent(1500, 1000)).toBe(50);
    expect(changePercent(800, 1000)).toBe(-20);
    expect(changePercent(1234, 1000)).toBe(23.4);
  });

  test("returns null when there is no previous period to compare against", () => {
    expect(changePercent(500, 0)).toBeNull();
  });
});
