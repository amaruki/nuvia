import type { Category, CategoryScope, CategoryType } from "@/types/category.types";

import type { RawCategory } from "./types";

function toDate(value: unknown): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value as string);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function hydrateCategory(raw: RawCategory): Category {
  return {
    id: raw.id,
    name: raw.name,
    slug: raw.slug,
    description: raw.description || undefined,
    type: raw.type as CategoryType,
    status: raw.status,
    scope: raw.scope as CategoryScope,
    color: raw.color ?? "#6366f1",
    icon: raw.icon,
    emoji: raw.emoji,
    parentId: raw.parentId,
    order: raw.order,
    contentCount: raw.contentCount,
    allowedRoles: raw.allowedRoles,
    allowedChapters: raw.allowedChapters,
    allowedCommittees: raw.allowedCommittees,
    createdAt: toDate(raw.createdAt) ?? new Date(),
    updatedAt: toDate(raw.updatedAt) ?? new Date(),
    createdBy: raw.createdBy,
    updatedBy: raw.lastModifiedBy,
  };
}
