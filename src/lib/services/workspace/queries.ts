/**
 * Workspace reads — the paginated, filterable list and the single-row fetch.
 */

import { and, count, desc, eq, gte, ilike, inArray, lte, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db/client";
import { workspace } from "@/db/schema";
import type {
  CommitteeRole,
  CommitteeWorkspace,
  WorkspaceStatus,
  WorkspaceType,
} from "@/types/committee";
import {
  UI_TO_DB_STATUS,
  UI_TO_DB_TYPE,
  WORKSPACE_MEMBER_ROLES,
  csvValues,
  paginate,
  toUiWorkspace,
} from "./helpers";
import type { DbWorkspaceStatus, DbWorkspaceType, Paginated, WorkspaceListFilters } from "./types";

function buildListWhere(filters: WorkspaceListFilters): SQL | undefined {
  const clauses: SQL[] = [];

  const statuses = csvValues(filters.status)
    ?.map((value) => UI_TO_DB_STATUS[value as WorkspaceStatus])
    .filter((value): value is DbWorkspaceStatus => value !== undefined);
  if (statuses && statuses.length > 0) {
    clauses.push(inArray(workspace.status, statuses));
  }

  const types = csvValues(filters.type)
    ?.map((value) => UI_TO_DB_TYPE[value as WorkspaceType])
    .filter((value): value is DbWorkspaceType => value !== undefined);
  if (types && types.length > 0) {
    clauses.push(inArray(workspace.type, types));
  }

  const memberRoles = csvValues(filters.memberRole)?.filter((value): value is CommitteeRole =>
    (WORKSPACE_MEMBER_ROLES as readonly string[]).includes(value),
  );
  if (memberRoles && memberRoles.length > 0) {
    // Roster lives in the members jsonb blob; match any entry's role.
    clauses.push(sql`exists (
      select 1 from jsonb_array_elements(${workspace.members}) as member
      where member->>'role' in (${sql.join(
        memberRoles.map((role) => sql`${role}`),
        sql`, `,
      )})
    )`);
  }

  if (filters.createdAfter) {
    const after = new Date(filters.createdAfter);
    if (!Number.isNaN(after.getTime())) clauses.push(gte(workspace.createdAt, after));
  }
  if (filters.createdBefore) {
    const before = new Date(filters.createdBefore);
    if (!Number.isNaN(before.getTime())) clauses.push(lte(workspace.createdAt, before));
  }

  if (filters.search && filters.search.trim().length > 0) {
    const term = `%${filters.search.trim()}%`;
    const searchClause = or(ilike(workspace.name, term), ilike(workspace.description, term));
    if (searchClause) clauses.push(searchClause);
  }

  return clauses.length > 0 ? and(...clauses) : undefined;
}

export async function listWorkspaces(
  filters: WorkspaceListFilters = {},
): Promise<Paginated<CommitteeWorkspace>> {
  const { page, limit, offset } = paginate(filters.page, filters.limit);
  const where = buildListWhere(filters);

  const [rows, totalRows] = await Promise.all([
    db
      .select()
      .from(workspace)
      .where(where)
      .orderBy(desc(workspace.createdAt), desc(workspace.id))
      .limit(limit)
      .offset(offset),
    db.select({ value: count() }).from(workspace).where(where),
  ]);
  const total = totalRows[0]?.value ?? 0;

  return {
    items: rows.map(toUiWorkspace),
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function getWorkspace(id: string): Promise<CommitteeWorkspace | null> {
  const rows = await db.select().from(workspace).where(eq(workspace.id, id)).limit(1);
  if (rows.length === 0) return null;
  return toUiWorkspace(rows[0]);
}
