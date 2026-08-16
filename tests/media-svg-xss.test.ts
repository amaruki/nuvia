/**
 * Security issue #6 — SVG uploads are stored XSS.
 *
 * SVG is a scriptable XML document: an uploaded `<svg><script>` payload
 * executes for anyone who opens the media URL when the browser renders it
 * inline as a top-level document. Two layers are pinned here:
 *
 * 1. Upload gate: `image/svg+xml` is rejected outright (400), both at the
 *    service level (`saveUpload`) and through the POST route.
 * 2. Serving contract: a legacy SVG row that predates the gate must be
 *    served as `attachment` with `application/octet-stream` +
 *    `X-Content-Type-Options: nosniff` so the browser can never render it
 *    as a document.
 *
 * Route invocation seam: the media routes call `requirePermission(perm)`
 * without a headers override, so session resolution goes through
 * next/headers's ambient `headers()`. The suite mocks `next/headers` (the
 * same seam used by tests/forums-participation.test.ts) so the real routes
 * run end-to-end — auth, validation, service layer, disk I/O — with the
 * currently-dispatched request's headers made ambient.
 */

import { afterAll, beforeAll, describe, expect, mock, test } from "bun:test";
import { mkdir, rm, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest } from "next/server";
import * as nextHeadersModule from "next/headers";

import { POST as uploadMedia } from "@/app/api/v1/media/route";
import { GET as serveMediaById } from "@/app/api/v1/media/[id]/route";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { user } from "@/db/schema/users";
import { eq, inArray } from "drizzle-orm";
import {
  saveUpload,
  UPLOAD_DIR,
  type MediaUploadRecord,
} from "@/lib/services/media-upload.service";
import { testIp } from "./helpers";

const RUN_ID = `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
const PASSWORD = "Sup3r-Secret-Passw0rd!";
const MANIFEST_PATH = path.join(UPLOAD_DIR, "manifest.json");

// Ambient-headers seam (mirrors tests/forums-participation.test.ts).
const originalNextHeaders = { ...nextHeadersModule };
let ambientHeaders: Headers = new Headers();
mock.module("next/headers", () => ({
  ...originalNextHeaders,
  headers: async () => ambientHeaders,
}));

type MediaRoute = (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => Promise<Response>;

async function callRoute(request: NextRequest, handler: MediaRoute, id?: string) {
  ambientHeaders = request.headers;
  return handler(request, { params: Promise.resolve({ id: id ?? "" }) });
}

const SVG_PAYLOAD = `<svg xmlns="http://www.w3.org/2000/svg"><script>alert(document.cookie)</script></svg>`;
/** 1x1 transparent PNG — a minimal legitimate image. */
const PNG_BYTES = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);

let admin = { userId: "", cookie: "" };
const userIds: string[] = [];
const seededFiles: string[] = [];
const seededRecordIds: string[] = [];

function authedRequest(
  url: string,
  options: { method?: string; body?: BodyInit } = {},
): NextRequest {
  const headers = new Headers();
  headers.set("x-forwarded-for", testIp());
  headers.set("cookie", admin.cookie);
  return new NextRequest(url, {
    method: options.method ?? "GET",
    headers,
    body: options.body,
  });
}

async function signUpAdmin(): Promise<void> {
  const email = `media-sec-admin-${RUN_ID}@example.test`;
  const res = await auth.handler(
    new Request("http://localhost:3000/api/auth/sign-up/email", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": testIp() },
      body: JSON.stringify({
        email,
        password: PASSWORD,
        name: "Media Sec Admin",
        username: `media-sec-admin-${RUN_ID}`,
      }),
    }),
  );
  const body = (await res.json()) as { user?: { id: string } };
  if (!res.ok || !body.user) throw new Error(`sign-up failed: ${res.status}`);
  userIds.push(body.user.id);

  await db.update(user).set({ role: "admin" }).where(eq(user.id, body.user.id));

  const signIn = await auth.handler(
    new Request("http://localhost:3000/api/auth/sign-in/email", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": testIp() },
      body: JSON.stringify({ email, password: PASSWORD }),
    }),
  );
  if (!signIn.ok) throw new Error(`sign-in failed: ${signIn.status}`);
  const cookie = signIn.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .join("; ");
  admin = { userId: body.user.id, cookie };
}

async function readManifest(): Promise<MediaUploadRecord[]> {
  try {
    return JSON.parse(await readFile(MANIFEST_PATH, "utf8")) as MediaUploadRecord[];
  } catch {
    return [];
  }
}

async function writeManifest(records: MediaUploadRecord[]): Promise<void> {
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(MANIFEST_PATH, JSON.stringify(records, null, 2), "utf8");
}

/** Simulates a manifest row created BEFORE the SVG gate existed. */
async function seedLegacySvgRow(): Promise<MediaUploadRecord> {
  const id = `legacy-svg-${RUN_ID}-${Math.random().toString(36).slice(2, 8)}`;
  const filename = `${id}-evil.svg`;
  const storagePath = path.join(UPLOAD_DIR, filename);
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(storagePath, SVG_PAYLOAD, "utf8");
  seededFiles.push(storagePath);

  const record: MediaUploadRecord = {
    id,
    filename,
    originalName: "evil.svg",
    contentType: "image/svg+xml",
    size: SVG_PAYLOAD.length,
    checksum: "legacy-test-row",
    storagePath,
    url: `/api/v1/media/${id}`,
    uploadedBy: admin.userId,
    uploadedAt: new Date().toISOString(),
  };
  const records = await readManifest();
  records.push(record);
  await writeManifest(records);
  seededRecordIds.push(id);
  return record;
}

beforeAll(async () => {
  await signUpAdmin();
}, 30_000);

describe("security issue #6 — SVG uploads are stored XSS", () => {
  test("service gate: saveUpload rejects image/svg+xml with 400", async () => {
    const file = new File([SVG_PAYLOAD], "evil.svg", { type: "image/svg+xml" });
    let caught: unknown = null;
    try {
      await saveUpload(file, admin.userId);
    } catch (error) {
      caught = error;
    }
    expect(caught).not.toBeNull();
    const err = caught as { status?: number; slug?: string };
    expect(err.status).toBe(400);
    expect(err.slug).toBe("invalid-request-format");
  });

  test("route gate: POST /api/v1/media rejects an SVG upload with 400", async () => {
    const formData = new FormData();
    formData.append("file", new File([SVG_PAYLOAD], "evil.svg", { type: "image/svg+xml" }));
    const res = await callRoute(
      authedRequest("http://localhost:3000/api/v1/media", { method: "POST", body: formData }),
      uploadMedia,
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { type?: string; status?: number };
    expect(body.status).toBe(400);
    expect(body.type ?? "").toEndWith("/problems/invalid-request-format");

    // Nothing reached the manifest.
    const rows = (await readManifest()).filter((r) => r.originalName === "evil.svg");
    expect(rows).toHaveLength(0);
  });

  test("no regression: legitimate PNG uploads still work", async () => {
    const file = new File([PNG_BYTES], "pixel.png", { type: "image/png" });
    const record = await saveUpload(file, admin.userId);
    expect(record.id).not.toBe("");
    expect(record.contentType).toBe("image/png");
    seededRecordIds.push(record.id);
    seededFiles.push(record.storagePath);
  });

  test("serving contract: a legacy SVG row is served as an attachment, never a document", async () => {
    const record = await seedLegacySvgRow();
    const res = await callRoute(
      authedRequest(`http://localhost:3000/api/v1/media/${record.id}`),
      serveMediaById,
      record.id,
    );
    expect(res.status).toBe(200);
    // The browser must download, not render — no document, no script.
    expect(res.headers.get("content-disposition") ?? "").toStartWith("attachment");
    // The SVG content type is stripped so nothing can sniff it back.
    expect(res.headers.get("content-type")).toBe("application/octet-stream");
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
  });

  test("serving contract: a legitimate PNG is still served inline with its own type", async () => {
    const file = new File([PNG_BYTES], "inline.png", { type: "image/png" });
    const record = await saveUpload(file, admin.userId);
    seededRecordIds.push(record.id);
    seededFiles.push(record.storagePath);

    const res = await callRoute(
      authedRequest(`http://localhost:3000/api/v1/media/${record.id}`),
      serveMediaById,
      record.id,
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/png");
    expect(res.headers.get("content-disposition") ?? "").toStartWith("inline");
  });

  test("unauthenticated: GET on a media row is rejected before serving", async () => {
    const record = await seedLegacySvgRow();
    const anon = new NextRequest(`http://localhost:3000/api/v1/media/${record.id}`, {
      headers: new Headers({ "x-forwarded-for": testIp() }),
    });
    const res = await callRoute(anon, serveMediaById, record.id);
    expect(res.status).toBe(401);
  });
});

afterAll(async () => {
  mock.module("next/headers", () => ({ ...originalNextHeaders }));
  if (seededRecordIds.length > 0) {
    const remaining = (await readManifest()).filter((r) => !seededRecordIds.includes(r.id));
    await writeManifest(remaining);
  }
  for (const file of seededFiles) {
    await rm(file, { force: true });
  }
  if (userIds.length > 0) {
    await db.delete(user).where(inArray(user.id, userIds));
  }
}, 30_000);
