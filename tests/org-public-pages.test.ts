/**
 * tests/org-public-pages.test.ts
 *
 * Public organization pages read paths (plan UI-29, exposure audit row
 * "Chapters and committees", D15: leadership names public, rosters private):
 * - Public chapter list returns ONLY ACTIVE chapters — INACTIVE, PENDING and
 *   SUSPENDED units never surface; non-ACTIVE details are unreachable.
 * - Detail projections carry leadership names/titles but NEVER roster
 *   emails/phones; regular MEMBER rows and inactive officers never appear.
 * - Same guarantees for committees, whose status is lowercase free text
 *   ("active" | "inactive" | "pending" | "suspended"); audience-ready state
 *   is lowercase "active" (mapping documented in services/committee/public.ts).
 *
 * Runs against real Postgres through the service layers (no HTTP). Every row
 * is tagged with RUN_ID and removed in afterAll; passes on empty or seeded DB.
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { inArray, like } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { chapter, chapterMember, committee, committeeMember, user } from "@/db/schema";
import {
  createChapter,
  getPublicChapter,
  listPublicChapters,
  type CreateChapterInput,
} from "@/lib/services/chapter";
import {
  createCommittee,
  getPublicCommittee,
  listPublicCommittees,
  type CreateCommitteeInput,
} from "@/lib/services/committee";

import { testIp } from "./helpers";

const RUN_ID = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const PASSWORD = "Sup3r-Secret-Passw0rd!";
const ACTOR = `system:org-public-${RUN_ID}`;
const MISSING_UUID = "00000000-0000-4000-8000-000000000000";

const userIds: string[] = [];
const chapterIds: string[] = [];
const committeeIds: string[] = [];

/**
 * Roster PII seeded into chapter_members / committee_members below. No
 * public projection may ever contain one of these values; the sweeps assert
 * absence against the full serialized results.
 */
const PII = {
  chapterPresidentEmail: `chpres-${RUN_ID}@roster.test`,
  chapterPresidentPhone: "+1 555 010 1001",
  chapterTreasurerEmail: `chtreas-${RUN_ID}@roster.test`,
  chapterTreasurerPhone: "+1 555 010 1002",
  chapterFormerSecretaryEmail: `chformer-${RUN_ID}@roster.test`,
  chapterRosterMemberEmail: `chmember-${RUN_ID}@roster.test`,
  chapterRosterMemberPhone: "+1 555 010 1003",
  committeeChairEmail: `cmchair-${RUN_ID}@roster.test`,
  committeeFormerAdvisorEmail: `cmformer-${RUN_ID}@roster.test`,
  committeeRosterMemberEmail: `cmmember-${RUN_ID}@roster.test`,
} as const;

const ids = {
  chapters: { active: "", inactive: "", pending: "", suspended: "" },
  committees: { active: "", inactive: "", pending: "", suspended: "" },
};
const cmIds = ids.committees;

function chapterPayload(
  suffix: string,
  status: "active" | "inactive" | "pending" | "suspended",
): CreateChapterInput {
  return {
    name: `org-pub-ch-${suffix}-${RUN_ID}`,
    displayName: `Org Public ${suffix} Chapter ${RUN_ID}`,
    description: `Public pages test chapter ${suffix} (${RUN_ID}).`,
    status,
    location: {
      address: "1 Public Way",
      city: "Testville",
      state: "Testland",
      country: "Testonia",
      postalCode: "12345",
      timezone: "UTC",
      region: `Org Public Region ${RUN_ID}`,
    },
    contactInfo: {
      email: `chapter-${suffix}-${RUN_ID}@example.test`,
      phone: "+1 555 0100",
      website: "https://chapters.example.test",
      address: "1 Public Way, Testville",
    },
    socialMedia: {},
    settings: {
      allowOnlineRegistration: false,
      requireApproval: false,
      membershipDues: 0,
      meetingFrequency: "monthly",
      meetingDay: "Second Tuesday",
      meetingTime: "18:30",
      autoRenewMembership: false,
      sendReminders: false,
      publicDirectory: false,
    },
    parentChapterId: null,
    memberCount: 42,
    establishedDate: new Date("2019-06-01T00:00:00Z"),
  };
}

function committeePayload(
  suffix: string,
  status: "active" | "inactive" | "pending" | "suspended",
): CreateCommitteeInput {
  return {
    name: `org-pub-cm-${suffix}-${RUN_ID}`,
    displayName: `Org Public ${suffix} Committee ${RUN_ID}`,
    description: `Public pages test committee ${suffix} (${RUN_ID}).`,
    purpose: `Mandate statement for the ${suffix} test committee ${RUN_ID}.`,
    status,
    type: "standing",
    charter: {
      missionStatement: `Mission statement for the ${suffix} test committee ${RUN_ID}.`,
      responsibilities: ["Own the public pages test surface"],
      authorityLevel: "advisory",
      decisionMakingProcess: "Consensus at monthly meetings",
      reportingStructure: "Reports to the executive committee",
    },
    contactInfo: {
      email: `committee-${suffix}-${RUN_ID}@example.test`,
      phone: "+1 555 0200",
      meetingLocation: "Room 7, Convention Hall",
      virtualMeetingLink: "https://meet.example.test/committee",
      website: "https://committees.example.test",
    },
  };
}

async function signUpActor(): Promise<string> {
  // committees.created_by is a FK to users.id, so committee creation needs a
  // real user id (chapters.created_by is a plain actor string).
  const email = `org-public-actor-${RUN_ID}@example.test`;
  const res = await auth.handler(
    new Request("http://localhost:3000/api/auth/sign-up/email", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": testIp() },
      body: JSON.stringify({
        email,
        password: PASSWORD,
        name: "Org Public Actor",
        username: `org-pub-actor-${RUN_ID}`,
      }),
    }),
  );
  const body = (await res.json()) as { user?: { id: string } };
  if (!res.ok || !body.user) {
    throw new Error(`sign-up failed: ${res.status} ${JSON.stringify(body)}`);
  }
  userIds.push(body.user.id);
  return body.user.id;
}

beforeAll(async () => {
  const actorId = await signUpActor();

  for (const status of ["active", "inactive", "pending", "suspended"] as const) {
    const created = await createChapter(chapterPayload(status, status), ACTOR);
    ids.chapters[status] = created.id;
    chapterIds.push(created.id);
  }

  // Roster on the ACTIVE chapter: two officers with email+phone, one former
  // (inactive) officer, and one regular MEMBER — none of the emails/phones
  // may surface, and neither the MEMBER nor the former officer may appear.
  await db.insert(chapterMember).values([
    {
      chapterId: ids.chapters.active,
      role: "PRESIDENT",
      name: `Org President ${RUN_ID}`,
      email: PII.chapterPresidentEmail,
      phone: PII.chapterPresidentPhone,
    },
    {
      chapterId: ids.chapters.active,
      role: "TREASURER",
      title: "Finance Lead",
      name: `Org Treasurer ${RUN_ID}`,
      email: PII.chapterTreasurerEmail,
      phone: PII.chapterTreasurerPhone,
    },
    {
      chapterId: ids.chapters.active,
      role: "SECRETARY",
      isActive: false,
      name: `Org Former Secretary ${RUN_ID}`,
      email: PII.chapterFormerSecretaryEmail,
    },
    {
      chapterId: ids.chapters.active,
      role: "MEMBER",
      name: `Org Roster Member ${RUN_ID}`,
      email: PII.chapterRosterMemberEmail,
      phone: PII.chapterRosterMemberPhone,
    },
  ]);

  for (const status of ["active", "inactive", "pending", "suspended"] as const) {
    const created = await createCommittee(committeePayload(status, status), actorId);
    ids.committees[status] = created.id;
    committeeIds.push(created.id);
  }

  // Roster on the active committee: a chair, a former (inactive) advisor, and
  // a regular member — same exposure rules as chapter rosters.
  await db.insert(committeeMember).values([
    {
      committeeId: ids.committees.active,
      role: "chair",
      title: "Committee Chair",
      name: `Org Chair ${RUN_ID}`,
      email: PII.committeeChairEmail,
    },
    {
      committeeId: ids.committees.active,
      role: "advisor",
      isActive: false,
      name: `Org Former Advisor ${RUN_ID}`,
      email: PII.committeeFormerAdvisorEmail,
    },
    {
      committeeId: ids.committees.active,
      role: "member",
      name: `Org Committee Member ${RUN_ID}`,
      email: PII.committeeRosterMemberEmail,
    },
  ]);
});

afterAll(async () => {
  // chapter_members / committee_members cascade with their units; users go
  // last (committees.created_by references them). The name sweeps catch
  // anything an assertion-aborted test left behind.
  if (chapterIds.length > 0) {
    await db.delete(chapter).where(inArray(chapter.id, chapterIds));
  }
  await db.delete(chapter).where(like(chapter.name, `%${RUN_ID}%`));
  if (committeeIds.length > 0) {
    await db.delete(committee).where(inArray(committee.id, committeeIds));
  }
  await db.delete(committee).where(like(committee.name, `%${RUN_ID}%`));
  if (userIds.length > 0) {
    await db.delete(user).where(inArray(user.id, userIds));
  }
});

function expectNoPii(serialized: string): void {
  for (const value of Object.values(PII)) {
    expect(serialized).not.toContain(value);
  }
}

describe("public chapter list (ring 0)", () => {
  test("returns ONLY ACTIVE chapters; INACTIVE/PENDING/SUSPENDED never surface", async () => {
    const list = await listPublicChapters();

    const ours = list.filter((item) => item.displayName.includes(RUN_ID));
    expect(ours.length).toBe(1);
    expect(ours[0].id).toBe(ids.chapters.active);

    for (const hidden of [ids.chapters.inactive, ids.chapters.pending, ids.chapters.suspended]) {
      expect(list.some((item) => item.id === hidden)).toBe(false);
    }

    // The whole list projection is PII-free.
    expectNoPii(JSON.stringify(list));
  });
});

describe("public chapter detail (ring 0)", () => {
  test("ACTIVE chapter exposes leadership names but never roster PII", async () => {
    const page = await getPublicChapter(ids.chapters.active);
    expect(page).not.toBeNull();
    if (!page) return;

    // Leadership names and titles are public (D15).
    const names = page.leadership.map((leader) => leader.name);
    expect(names).toContain(`Org President ${RUN_ID}`);
    expect(names).toContain(`Org Treasurer ${RUN_ID}`);

    const president = page.leadership.find((l) => l.name === `Org President ${RUN_ID}`);
    expect(president?.title).toBe("President"); // role-title fallback
    const treasurer = page.leadership.find((l) => l.name === `Org Treasurer ${RUN_ID}`);
    expect(treasurer?.title).toBe("Finance Lead"); // stored title wins

    // Strict field allow-list on leadership entries: names/titles/roles only.
    for (const leader of page.leadership) {
      expect(Object.keys(leader).sort()).toEqual(["name", "role", "title"]);
    }

    // Roster emails/phones never surface — not even the officers'.
    const serialized = JSON.stringify(page);
    expectNoPii(serialized);

    // Regular roster members and inactive officers stay private.
    expect(serialized).not.toContain(`Org Roster Member ${RUN_ID}`);
    expect(serialized).not.toContain(`Org Former Secretary ${RUN_ID}`);

    // Real column data does surface: meeting cadence from settings jsonb,
    // unit-level contact info from the contact_info jsonb.
    expect(page.meeting.frequency).toBe("monthly");
    expect(page.contact.email).toBe(`chapter-active-${RUN_ID}@example.test`);
    expect(page.memberCount).toBe(42);
  });

  test("non-ACTIVE chapters are unreachable", async () => {
    for (const hidden of [ids.chapters.inactive, ids.chapters.pending, ids.chapters.suspended]) {
      expect(await getPublicChapter(hidden)).toBeNull();
    }
    expect(await getPublicChapter(MISSING_UUID)).toBeNull();
    expect(await getPublicChapter("not-a-uuid")).toBeNull();
  });
});

describe("public committee list (ring 0)", () => {
  test("returns ONLY active committees; lowercase text statuses mapped", async () => {
    const list = await listPublicCommittees();

    const ours = list.filter((item) => item.displayName.includes(RUN_ID));
    expect(ours.length).toBe(1);
    expect(ours[0].id).toBe(cmIds.active);

    for (const hidden of [cmIds.inactive, cmIds.pending, cmIds.suspended]) {
      expect(list.some((item) => item.id === hidden)).toBe(false);
    }

    expectNoPii(JSON.stringify(list));
  });
});

describe("public committee detail (ring 0)", () => {
  test("active committee exposes leadership names but never roster PII", async () => {
    const page = await getPublicCommittee(cmIds.active);
    expect(page).not.toBeNull();
    if (!page) return;

    const names = page.leadership.map((leader) => leader.name);
    expect(names).toContain(`Org Chair ${RUN_ID}`);

    const chair = page.leadership.find((l) => l.name === `Org Chair ${RUN_ID}`);
    expect(chair?.title).toBe("Committee Chair");

    for (const leader of page.leadership) {
      expect(Object.keys(leader).sort()).toEqual(["name", "role", "title"]);
    }

    const serialized = JSON.stringify(page);
    expectNoPii(serialized);
    expect(serialized).not.toContain(`Org Committee Member ${RUN_ID}`);
    expect(serialized).not.toContain(`Org Former Advisor ${RUN_ID}`);

    // Real column data surfaces: unit contact + meeting location columns.
    expect(page.contact.email).toBe(`committee-active-${RUN_ID}@example.test`);
    expect(page.contact.meetingLocation).toBe("Room 7, Convention Hall");
    expect(page.purpose).toContain(RUN_ID);
  });

  test("non-active committees are unreachable", async () => {
    for (const hidden of [cmIds.inactive, cmIds.pending, cmIds.suspended]) {
      expect(await getPublicCommittee(hidden)).toBeNull();
    }
    expect(await getPublicCommittee(MISSING_UUID)).toBeNull();
    expect(await getPublicCommittee("not-a-uuid")).toBeNull();
  });
});
