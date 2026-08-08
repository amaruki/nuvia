/**
 * D1 — Chapters API: read and update semantics.
 * Part of the split chapters suite in tests/chapters-api/.
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { POST as createChapter } from "@/app/api/v1/chapters/route";
import { GET as getChapter, PATCH as updateChapter } from "@/app/api/v1/chapters/[id]/route";
import { API, buildRequest, createFixtures, ctx, parseEnvelope } from "./helpers";

const { RUN_ID, chapterIds, signUpWithRole, chapterPayload, cleanup } = createFixtures();

/** Values shared between ordered tests within this file. */
const state: Record<string, string> = {};

let admin = { userId: "", email: "", cookie: "" };
let staff = { userId: "", email: "", cookie: "" };
let member = { userId: "", email: "", cookie: "" };

beforeAll(async () => {
  [admin, staff, member] = await Promise.all([
    signUpWithRole("admin", "admin"),
    signUpWithRole("staff", "staff"),
    signUpWithRole("member", "member"),
  ]);
  // Alpha and beta came from earlier describes in the original single-file
  // suite; this file seeds its own copies.
  for (const [suffix, status] of [
    ["alpha", "active"],
    ["beta", "pending"],
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
    state[`${suffix}Id`] = envelope.data.id;
  }
});

afterAll(cleanup);

describe("chapter read and update", () => {
  test("fetch one chapter by id", async () => {
    const res = await getChapter(
      buildRequest(`${API}/${state.alphaId}`, { cookie: staff.cookie }),
      ctx({ id: state.alphaId }),
    );
    expect(res.status).toBe(200);
    const envelope = await parseEnvelope(res);
    expect(envelope.data.id).toBe(state.alphaId);
    expect(envelope.data.leadership).toEqual([]);
  });

  test("unknown id is a 404", async () => {
    const missing = "00000000-0000-4000-8000-000000000000";
    expect(
      (
        await getChapter(
          buildRequest(`${API}/${missing}`, { cookie: admin.cookie }),
          ctx({ id: missing }),
        )
      ).status,
    ).toBe(404);
  });

  test("update requires chapters:update and a non-empty body", async () => {
    expect(
      (
        await updateChapter(
          buildRequest(`${API}/${state.alphaId}`, {
            method: "PATCH",
            cookie: member.cookie,
            body: { displayName: "nope" },
          }),
          ctx({ id: state.alphaId }),
        )
      ).status,
    ).toBe(403);

    expect(
      (
        await updateChapter(
          buildRequest(`${API}/${state.alphaId}`, {
            method: "PATCH",
            cookie: admin.cookie,
            body: {},
          }),
          ctx({ id: state.alphaId }),
        )
      ).status,
    ).toBe(422);

    const missing = "00000000-0000-4000-8000-000000000000";
    expect(
      (
        await updateChapter(
          buildRequest(`${API}/${missing}`, {
            method: "PATCH",
            cookie: admin.cookie,
            body: { displayName: "ghost" },
          }),
          ctx({ id: missing }),
        )
      ).status,
    ).toBe(404);
  });

  test("staff updates fields and the response reflects them", async () => {
    const res = await updateChapter(
      buildRequest(`${API}/${state.alphaId}`, {
        method: "PATCH",
        cookie: staff.cookie,
        body: {
          displayName: `D1 alpha renamed ${RUN_ID}`,
          status: "suspended",
          settings: {
            allowOnlineRegistration: false,
            requireApproval: true,
            membershipDues: 40,
            meetingFrequency: "quarterly",
            autoRenewMembership: true,
            sendReminders: false,
            publicDirectory: false,
          },
        },
      }),
      ctx({ id: state.alphaId }),
    );
    expect(res.status).toBe(200);
    const envelope = await parseEnvelope(res);
    expect(envelope.data.displayName).toBe(`D1 alpha renamed ${RUN_ID}`);
    expect(envelope.data.status).toBe("suspended");
    expect(envelope.data.settings.membershipDues).toBe(40);
    expect(envelope.data.updatedBy).toBe(staff.email);
  });

  test("renaming onto an existing name conflicts", async () => {
    const res = await updateChapter(
      buildRequest(`${API}/${state.betaId}`, {
        method: "PATCH",
        cookie: admin.cookie,
        body: { name: `d1-chapter-alpha-${RUN_ID}` },
      }),
      ctx({ id: state.betaId }),
    );
    expect(res.status).toBe(409);
  });
});
