/**
 * Row mapping — `chapters` rows to the UI shape (src/types/chapter.types.ts),
 * the same contract the mock-era hook served.
 */

import type {
  Chapter,
  ChapterContactInfo,
  ChapterLeadership,
  ChapterSettings,
  ChapterSocialMedia,
  ChapterStatus,
} from "@/types/chapter.types";
import { NEUTRAL_FINANCES, NEUTRAL_METRICS } from "./statistics";
import type { ChapterRow, DbChapterStatus } from "./types";

// ---------------------------------------------------------------------------
// Status mapping (DB enums are SCREAMING_SNAKE, UI is lowercase)
// ---------------------------------------------------------------------------

export const UI_TO_DB_STATUS: Record<ChapterStatus, DbChapterStatus> = {
  active: "ACTIVE",
  inactive: "INACTIVE",
  pending: "PENDING",
  suspended: "SUSPENDED",
};

export const DB_TO_UI_STATUS: Record<DbChapterStatus, ChapterStatus> = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  PENDING: "pending",
  SUSPENDED: "suspended",
};

// ---------------------------------------------------------------------------
// Row mapping
// ---------------------------------------------------------------------------

export function toUiSettings(raw: unknown): ChapterSettings {
  const s = (raw ?? {}) as Partial<ChapterSettings>;
  return {
    allowOnlineRegistration: s.allowOnlineRegistration ?? false,
    requireApproval: s.requireApproval ?? false,
    membershipDues: s.membershipDues ?? 0,
    meetingFrequency: s.meetingFrequency ?? "monthly",
    meetingDay: s.meetingDay,
    meetingTime: s.meetingTime,
    autoRenewMembership: s.autoRenewMembership ?? false,
    sendReminders: s.sendReminders ?? false,
    publicDirectory: s.publicDirectory ?? false,
  };
}

export function toUiContactInfo(raw: unknown): ChapterContactInfo {
  const c = (raw ?? {}) as Partial<ChapterContactInfo>;
  return {
    email: c.email ?? "",
    phone: c.phone,
    website: c.website,
    address: c.address ?? "",
    mailingAddress: c.mailingAddress,
  };
}

export function toUiChapter(
  row: ChapterRow,
  leadership: ChapterLeadership[],
  subChapterIds: string[],
): Chapter {
  return {
    id: row.id,
    name: row.name,
    displayName: row.displayName,
    description: row.description ?? undefined,
    status: DB_TO_UI_STATUS[row.status as DbChapterStatus] ?? "pending",
    location: {
      address: row.address ?? "",
      city: row.city ?? "",
      state: row.state ?? "",
      country: row.country ?? "",
      postalCode: row.postalCode ?? "",
      coordinates:
        row.latitude !== null && row.longitude !== null
          ? { latitude: row.latitude, longitude: row.longitude }
          : undefined,
      timezone: row.timezone ?? "UTC",
      region: row.region ?? "",
    },
    leadership,
    memberCount: row.memberCount,
    establishedDate: row.establishedDate ?? row.createdAt,
    parentChapterId: row.parentChapterId ?? undefined,
    subChapterIds,
    contactInfo: toUiContactInfo(row.contactInfo),
    socialMedia: (row.socialMedia ?? {}) as ChapterSocialMedia,
    // Neutral placeholders until the metrics/events/finance tables land.
    metrics: NEUTRAL_METRICS,
    events: [],
    finances: NEUTRAL_FINANCES,
    settings: toUiSettings(row.settings),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy ?? undefined,
  };
}
