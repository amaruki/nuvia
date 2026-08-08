/**
 * D1 — Chapters API: list envelope, filters, search, pagination
 * (baseline-delta via RUN_ID). Part of the split chapters suite in
 * tests/chapters-api/.
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { GET as listChapters, POST as createChapter } from "@/app/api/v1/chapters/route";
import { API, buildRequest, createFixtures, parseEnvelope } from "./helpers";

const { RUN_ID, chapterIds, signUpWithRole, chapterPayload, cleanup } = createFixtures();

let admin = { userId: "", email: "", cookie: "" };

beforeAll(async () => {
  admin = await signUpWithRole("admin", "admin");
  // This file stands alone, so it seeds the whole RUN_ID delta itself —
  // alpha as well as the beta/gamma rows the filter assertions need.
  for (const [suffix, status] of [
    ["alpha", "active"],
    ["beta", "pending"],
    ["gamma", "inactive"],
  ] as const) {
    const res = await createChapter(
      buildRequest(API, {
        method: "POST",
        cookie: admin.cookie,
        body: chapterPayload(suffix, { status }),
      }),
    );
    const envelope = await parseEnvelope(res);
    chapterIds.push(envelope.data.id);
  }
});

afterAll(cleanup);

describe("chapter listing", () => {
  test("list returns the envelope with meta for the RUN_ID delta", async () => {
    const res = await listChapters(
      buildRequest(`${API}?search=${RUN_ID}&limit=100`, { cookie: admin.cookie }),
    );
    expect(res.status).toBe(200);

    const envelope = await parseEnvelope(res);
    expect(Array.isArray(envelope.data)).toBe(true);
    // Baseline delta: nothing matched RUN_ID before this run created rows.
    expect(envelope.data.length).toBe(3);
    expect(envelope.meta.page).toBe(1);
    expect(envelope.meta.limit).toBe(100);
    expect(envelope.meta.total).toBe(3);
    expect(envelope.meta.totalPages).toBe(1);

    const names = envelope.data.map((row: any) => row.name).sort();
    expect(names).toEqual([
      `d1-chapter-alpha-${RUN_ID}`,
      `d1-chapter-beta-${RUN_ID}`,
      `d1-chapter-gamma-${RUN_ID}`,
    ]);
  });

  test("status filter narrows the delta", async () => {
    const res = await listChapters(
      buildRequest(`${API}?search=${RUN_ID}&status=pending`, { cookie: admin.cookie }),
    );
    const envelope = await parseEnvelope(res);
    expect(envelope.data.length).toBe(1);
    expect(envelope.data[0].status).toBe("pending");
  });

  test("region filter narrows the delta", async () => {
    const region = encodeURIComponent(`D1 Region ${RUN_ID}`);
    const res = await listChapters(
      buildRequest(`${API}?search=${RUN_ID}&region=${region}`, { cookie: admin.cookie }),
    );
    const envelope = await parseEnvelope(res);
    expect(envelope.data.length).toBe(3);

    const miss = await listChapters(
      buildRequest(`${API}?search=${RUN_ID}&region=${encodeURIComponent("Nowhere")}`, {
        cookie: admin.cookie,
      }),
    );
    expect((await parseEnvelope(miss)).data.length).toBe(0);
  });

  test("pagination slices the delta", async () => {
    const res = await listChapters(
      buildRequest(`${API}?search=${RUN_ID}&limit=2&page=1`, { cookie: admin.cookie }),
    );
    const envelope = await parseEnvelope(res);
    expect(envelope.data.length).toBe(2);
    expect(envelope.meta.limit).toBe(2);
    expect(envelope.meta.total).toBe(3);
    expect(envelope.meta.totalPages).toBe(2);

    const pageTwo = await parseEnvelope(
      await listChapters(
        buildRequest(`${API}?search=${RUN_ID}&limit=2&page=2`, { cookie: admin.cookie }),
      ),
    );
    expect(pageTwo.data.length).toBe(1);
  });
});
