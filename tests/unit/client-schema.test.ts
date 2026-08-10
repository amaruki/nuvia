/**
 * UI-05 — Members directory client: regression coverage for the zod schema
 * that validates GET /api/v1/members rows on the client.
 *
 * The members API omits `image` and `bio` when they are unset, so the client
 * schema must accept their absence (`.nullish()`, not `.nullable()`), and a
 * malformed payload must surface a human-readable message instead of a raw
 * zod issue dump rendered to the admin.
 *
 * Pure client test — no database required.
 */

import { afterEach, describe, expect, test } from "bun:test";
import { fetchMembersPage } from "@/lib/hooks/use-memberships/members-api";

const originalFetch = globalThis.fetch;

/** A full member row as the API serves it; callers may strip/override keys. */
function memberRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "u-1",
    username: "jane",
    email: "jane@example.com",
    name: "Jane Doe",
    firstName: "Jane",
    lastName: "Doe",
    role: "member",
    emailVerified: true,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-02T00:00:00.000Z",
    memberStatus: "none",
    subscription: null,
    ...overrides,
  };
}

function pageOf(members: unknown[]) {
  return {
    data: { members },
    meta: { page: 1, limit: 100, total: members.length, totalPages: 1 },
  };
}

function stubFetch(body: unknown, ok = true) {
  globalThis.fetch = (async () =>
    ({
      ok,
      json: async () => body,
    }) as unknown as Response) as unknown as typeof fetch;
}

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("fetchMembersPage — UI-05 directory schema regression", () => {
  test("accepts members whose image and bio are omitted by the API", async () => {
    // The API omits both fields when unset; the old `.nullable()` schema
    // rejected `undefined` and collapsed the whole directory.
    stubFetch(pageOf([memberRow()]));

    const page = await fetchMembersPage(new URLSearchParams({ limit: "100" }));

    expect(page.data.members).toHaveLength(1);
    expect(page.data.members[0].image).toBeUndefined();
    expect(page.data.members[0].bio).toBeUndefined();
  });

  test("still accepts explicit null image and bio", async () => {
    stubFetch(pageOf([memberRow({ image: null, bio: null })]));

    const page = await fetchMembersPage(new URLSearchParams());

    expect(page.data.members[0].image).toBeNull();
    expect(page.data.members[0].bio).toBeNull();
  });

  test("maps a malformed payload to a human message, not a raw zod dump", async () => {
    stubFetch({ data: { members: [{ id: "broken" }] }, meta: {} });

    let caught: unknown;
    try {
      await fetchMembersPage(new URLSearchParams());
    } catch (err) {
      caught = err;
    }

    expect(caught).toBeInstanceOf(Error);
    const message = (caught as Error).message;
    expect(message).toContain("user directory");
    // No zod internals may leak into what the admin sees.
    expect(message).not.toContain("invalid_type");
    expect(message.toLowerCase()).not.toContain("required");
    expect(message).not.toContain('"path"');
  });

  test("surfaces the server problem detail for non-ok responses", async () => {
    stubFetch({ title: "Unauthorized", detail: "Sign in to view members." }, false);

    await expect(fetchMembersPage(new URLSearchParams())).rejects.toThrow(
      "Sign in to view members.",
    );
  });
});
