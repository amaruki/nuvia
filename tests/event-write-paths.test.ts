/**
 * UI-02 — Event write paths must persist through the API.
 *
 * The dashboard create/edit forms and the public organizer edit page used to
 * "save" via setTimeout without ever hitting an endpoint. These tests drive
 * the exact route handlers those wired forms call:
 *
 *   - POST   /api/v1/events            (create)
 *   - PATCH  /api/v1/events/[id]       (update)
 *   - GET    /api/v1/events/categories (category reference data for the form)
 *   - POST   /api/v1/events/categories (create category when none exist)
 *
 * and assert the rows actually land in the database.
 */
import { afterAll, describe, expect, test } from "bun:test";
import { eq, inArray } from "drizzle-orm";

import { db } from "@/db/client";
import { event, eventCategory, user } from "@/db/schema";
import { POST as createEventRoute } from "@/app/api/v1/events/route";
import { GET as getEventRoute, PATCH as updateEventRoute } from "@/app/api/v1/events/[id]/route";
import {
  GET as listCategoriesRoute,
  POST as createCategoryRoute,
} from "@/app/api/v1/events/categories/route";

import { buildRequest, ctx, parseEnvelope, createFixtures } from "./workspaces-api/fixtures";

const API = "http://localhost:3000/api/v1/events";
const fixtures = createFixtures();
const { RUN_ID, signUpWithRole } = fixtures;

const createdEventIds: string[] = [];
const createdCategoryIds: string[] = [];
const createdUserIds: string[] = [];

const state = {
  adminCookie: "",
  organizerCookie: "",
  organizerId: "",
  memberCookie: "",
  categoryId: "",
  categoryName: `workshops-${RUN_ID}`,
  eventId: "",
};

interface CategoryDto {
  id: string;
  name: string;
  displayName: string;
}

interface EventDto {
  id: string;
  title: string;
  capacity: number | null;
  categoryId: string | null;
}

afterAll(async () => {
  if (createdEventIds.length > 0) {
    await db.delete(event).where(inArray(event.id, createdEventIds));
  }
  if (createdCategoryIds.length > 0) {
    await db.delete(eventCategory).where(inArray(eventCategory.id, createdCategoryIds));
  }
  if (createdUserIds.length > 0) {
    await db.delete(user).where(inArray(user.id, createdUserIds));
  }
});

async function seedUsers() {
  if (state.adminCookie) return;
  const admin = await signUpWithRole(`admin-${RUN_ID}`, "admin");
  const organizer = await signUpWithRole(`organizer-${RUN_ID}`, "organizer");
  const member = await signUpWithRole(`member-${RUN_ID}`, "member");
  state.adminCookie = admin.cookie;
  state.organizerCookie = organizer.cookie;
  state.organizerId = organizer.userId;
  state.memberCookie = member.cookie;
  createdUserIds.push(admin.userId, organizer.userId, member.userId);
}

describe("UI-02 event write paths", () => {
  test("unauthenticated category listing is rejected", async () => {
    const res = await listCategoriesRoute(buildRequest(`${API}/categories`));
    expect(res.status).toBe(401);
  });

  test("member without events:manage cannot create categories", async () => {
    await seedUsers();
    const res = await createCategoryRoute(
      buildRequest(`${API}/categories`, {
        method: "POST",
        cookie: state.memberCookie,
        body: { name: `member-attempt-${RUN_ID}`, displayName: "Member Attempt" },
      }),
    );
    expect(res.status).toBe(403);
  });

  test("admin creates the category the create form offers", async () => {
    await seedUsers();
    const res = await createCategoryRoute(
      buildRequest(`${API}/categories`, {
        method: "POST",
        cookie: state.adminCookie,
        body: { name: state.categoryName, displayName: `Workshops ${RUN_ID}` },
      }),
    );
    expect(res.status).toBe(201);
    const envelope = await parseEnvelope(res);
    const created: CategoryDto = envelope.data;
    expect(created.id).toBeString();
    expect(created.name).toBe(state.categoryName);
    state.categoryId = created.id;
    createdCategoryIds.push(created.id);

    // The row must exist in the database, not just in the response.
    const [row] = await db
      .select()
      .from(eventCategory)
      .where(eq(eventCategory.id, state.categoryId));
    expect(row?.name).toBe(state.categoryName);

    // Duplicate names are refused, not silently duplicated.
    const dup = await createCategoryRoute(
      buildRequest(`${API}/categories`, {
        method: "POST",
        cookie: state.adminCookie,
        body: { name: state.categoryName, displayName: "Duplicate" },
      }),
    );
    expect(dup.status).toBe(409);
  });

  test("organizer can list categories for the form select", async () => {
    await seedUsers();
    const res = await listCategoriesRoute(
      buildRequest(`${API}/categories`, { cookie: state.organizerCookie }),
    );
    expect(res.status).toBe(200);
    const envelope = await parseEnvelope(res);
    const payload: { categories: CategoryDto[] } | CategoryDto[] = envelope.data;
    const categories = Array.isArray(payload) ? payload : payload.categories;
    expect(categories.some((c) => c.id === state.categoryId)).toBe(true);
  });

  test("organizer creates an event with the body the dashboard form sends", async () => {
    await seedUsers();
    // Mirrors what src/lib/services/event/mutations.ts#createEvent posts:
    // DB-vocabulary type/format, category by name, ISO timestamps, capacity.
    const res = await createEventRoute(
      buildRequest(API, {
        method: "POST",
        cookie: state.organizerCookie,
        body: {
          title: `UI-02 Round Trip ${RUN_ID}`,
          description: "An event created through the wired dashboard form.",
          category: state.categoryName,
          type: "WORKSHOP",
          format: "IN_PERSON",
          status: "DRAFT",
          visibility: "PUBLIC",
          capacity: 50,
          isVirtual: false,
          isFree: true,
          location: "Room 4, Community Hall",
          timezone: "UTC",
          startTime: "2027-03-15T09:00:00.000Z",
          endTime: "2027-03-15T11:00:00.000Z",
        },
      }),
    );
    expect(res.status).toBe(201);
    const envelope = await parseEnvelope(res);
    const payload: { event: EventDto } | EventDto = envelope.data;
    const dto = "event" in payload ? payload.event : payload;
    expect(dto.id).toBeString();
    state.eventId = dto.id;
    createdEventIds.push(dto.id);

    // Persistence check against the real table.
    const [row] = await db.select().from(event).where(eq(event.id, state.eventId));
    expect(row?.title).toBe(`UI-02 Round Trip ${RUN_ID}`);
    expect(row?.createdBy).toBe(state.organizerId);
    expect(row?.categoryId).toBe(state.categoryId);
    expect(row?.capacity).toBe(50);
  });

  test("the created event is readable through the detail route", async () => {
    const res = await getEventRoute(
      buildRequest(`${API}/${state.eventId}`, { cookie: state.organizerCookie }),
      ctx({ id: state.eventId }),
    );
    expect(res.status).toBe(200);
  });

  test("organizer edits the event via PATCH and the change persists", async () => {
    const res = await updateEventRoute(
      buildRequest(`${API}/${state.eventId}`, {
        method: "PATCH",
        cookie: state.organizerCookie,
        body: {
          title: `UI-02 Round Trip Edited ${RUN_ID}`,
          startTime: "2027-03-16T09:00:00.000Z",
          endTime: "2027-03-16T12:00:00.000Z",
        },
      }),
      ctx({ id: state.eventId }),
    );
    expect(res.status).toBe(200);

    const [row] = await db.select().from(event).where(eq(event.id, state.eventId));
    expect(row?.title).toBe(`UI-02 Round Trip Edited ${RUN_ID}`);
    expect(row?.startTime.toISOString()).toBe("2027-03-16T09:00:00.000Z");
  });

  test("member without events:update cannot edit the event", async () => {
    await seedUsers();
    const res = await updateEventRoute(
      buildRequest(`${API}/${state.eventId}`, {
        method: "PATCH",
        cookie: state.memberCookie,
        body: { title: "Hijacked title that must never persist" },
      }),
      ctx({ id: state.eventId }),
    );
    expect(res.status).toBe(403);

    const [row] = await db.select().from(event).where(eq(event.id, state.eventId));
    expect(row?.title).toBe(`UI-02 Round Trip Edited ${RUN_ID}`);
  });

  test("unauthenticated event creation is rejected", async () => {
    const res = await createEventRoute(
      buildRequest(API, {
        method: "POST",
        body: {
          title: "Anonymous event",
          description: "Should never be persisted.",
          type: "MEETUP",
          format: "VIRTUAL",
          startTime: "2027-03-15T09:00:00.000Z",
          endTime: "2027-03-15T10:00:00.000Z",
        },
      }),
    );
    expect(res.status).toBe(401);
  });
});
