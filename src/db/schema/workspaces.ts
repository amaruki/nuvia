/**
 * Workspaces — committee collaboration spaces (backlog D5, promotion queue).
 *
 * The table is driven by the shape the dashboard already renders
 * (CommitteeWorkspace in src/types/committee.types.ts): identity, a
 * type/status lifecycle, a settings blob, and the roster + collaboration
 * collections (members, documents, tasks, discussions, meetings, activity).
 * The nested collections travel as jsonb — the same technique C5 used for
 * events' nested documents — because no backing tables exist for them yet;
 * they start empty and the service renders empty arrays, the staging
 * pattern chapters uses for metrics/events/finances.
 *
 * `committeeId` links the owning committee (nullable, set-null on committee
 * delete). `createdBy`/`updatedBy` are users.id FKs holding the acting
 * user's id (the committees pattern).
 */

import { relations } from "drizzle-orm";
import {
  index,
  jsonb,
  pgEnum,
  text,
  timestamp,
  uuid,
  pgTable,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { committee } from "./committees";
import { user } from "./users";

/** general | project | document | discussion | meeting */
export const workspaceTypeEnum = pgEnum("WorkspaceType", [
  "GENERAL",
  "PROJECT",
  "DOCUMENT",
  "DISCUSSION",
  "MEETING",
]);

/** active | archived | locked */
export const workspaceStatusEnum = pgEnum("WorkspaceStatus", ["ACTIVE", "ARCHIVED", "LOCKED"]);

export const workspace = pgTable(
  "workspaces",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Owning committee; null when a workspace is not (yet) committee-linked. */
    committeeId: uuid("committee_id").references((): AnyPgColumn => committee.id, {
      onDelete: "set null",
    }),
    /** Workspace name, unique — the add/edit form's "name" field. */
    name: text("name").notNull().unique(),
    description: text("description"),
    type: workspaceTypeEnum("type").notNull().default("GENERAL"),
    status: workspaceStatusEnum("status").notNull().default("ACTIVE"),
    /** Visibility, approval, file and permission settings (WorkspaceSettings). */
    settings: jsonb("settings").notNull().default({}),
    /** WorkspaceMember[] — roster; managed by seed/migration for now. */
    members: jsonb("members").notNull().default([]),
    /** WorkspaceDocument[] — file library (nested versions included). */
    documents: jsonb("documents").notNull().default([]),
    /** WorkspaceTask[] — task board (nested subtasks/comments/attachments). */
    tasks: jsonb("tasks").notNull().default([]),
    /** WorkspaceDiscussion[] — discussion threads (nested replies/reactions). */
    discussions: jsonb("discussions").notNull().default([]),
    /** WorkspaceMeeting[] — meetings (nested attendees/agenda/attachments). */
    meetings: jsonb("meetings").notNull().default([]),
    /** WorkspaceActivity[] — audit-style activity feed. */
    activity: jsonb("activity").notNull().default([]),
    /** Acting user id at creation time. */
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id),
    updatedBy: text("updated_by").references(() => user.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("workspaces_status_idx").on(table.status),
    index("workspaces_type_idx").on(table.type),
    index("workspaces_committee_id_idx").on(table.committeeId),
  ],
);

export const workspaceRelations = relations(workspace, ({ one }) => ({
  committee: one(committee, {
    fields: [workspace.committeeId],
    references: [committee.id],
  }),
}));
