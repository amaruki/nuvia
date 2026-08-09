/**
 * UI-05 — Admin registration cancellation carries a reason (the
 * AlertDialog+reason pattern from users/roles). The reason is merged into
 * the registration's jsonb metadata as `cancellationReason`.
 *
 * Pure unit test for the metadata merge helper — no database required.
 * End-to-end persistence is covered in
 * tests/events-write-api/registration-lifecycle.test.ts.
 */

import { describe, expect, test } from "bun:test";
import { withCancellationReason } from "@/lib/services/registration/mutations-cancel";

describe("withCancellationReason — cancellation reason metadata merge", () => {
  test("stores the reason when the registration has no metadata yet", () => {
    expect(withCancellationReason(null, "Double booking")).toEqual({
      cancellationReason: "Double booking",
    });
  });

  test("preserves existing metadata keys (e.g. notes) alongside the reason", () => {
    const metadata = { notes: "VIP attendee", source: "import" };

    expect(withCancellationReason(metadata, "No-show risk")).toEqual({
      notes: "VIP attendee",
      source: "import",
      cancellationReason: "No-show risk",
    });
  });

  test("does not mutate the incoming metadata object", () => {
    const metadata = { notes: "keep me" };

    withCancellationReason(metadata, "reason");

    expect(metadata).toEqual({ notes: "keep me" });
  });

  test("treats non-object metadata as empty", () => {
    expect(withCancellationReason("corrupted", "reason")).toEqual({
      cancellationReason: "reason",
    });
  });
});
