import type { Committee } from "@/types/committee";

import type { WireCommittee } from "./types";

/** ISO strings from the API parse to Date; unparseable values fall back to epoch. */
function parseDate(value: string): Date {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date(0) : parsed;
}

export function toCommitteeUi(raw: WireCommittee): Committee {
  return {
    ...raw,
    createdAt: parseDate(raw.createdAt),
    updatedAt: parseDate(raw.updatedAt),
    charter: {
      ...raw.charter,
      approvalDate: parseDate(raw.charter.approvalDate),
      lastReviewed: parseDate(raw.charter.lastReviewed),
      nextReview: parseDate(raw.charter.nextReview),
    },
    leadership: raw.leadership.map(({ startDate, endDate, ...rest }) => ({
      ...rest,
      startDate: parseDate(startDate),
      ...(endDate ? { endDate: parseDate(endDate) } : {}),
    })),
    members: raw.members.map(({ joinDate, endDate, ...rest }) => ({
      ...rest,
      joinDate: parseDate(joinDate),
      ...(endDate ? { endDate: parseDate(endDate) } : {}),
    })),
    meetings: raw.meetings.map(({ date, actionItems, ...rest }) => ({
      ...rest,
      date: parseDate(date),
      ...(actionItems
        ? {
            actionItems: actionItems.map(({ dueDate, ...itemRest }) => ({
              ...itemRest,
              dueDate: parseDate(dueDate),
            })),
          }
        : {}),
    })),
  };
}
