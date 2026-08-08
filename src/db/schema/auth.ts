/**
 * Authentication & authorization — translated from prisma/schema.prisma's
 * "AUTHENTICATION & AUTHORIZATION MODELS" section.
 *
 * `account`, `session`, `verification` are the tables better-auth's
 * drizzleAdapter reads/writes directly (see src/lib/auth.ts) — their column
 * set must keep matching what better-auth expects. `verificationToken` is a
 * legacy NextAuth-shaped table that predates better-auth and nothing in
 * src/ reads or writes it; kept for schema fidelity, flagged for removal in
 * TODO.md rather than dropped silently here.
 */

import { relations } from "drizzle-orm";
import { boolean, jsonb, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";
import { user } from "./users";

export const account = pgTable(
  "accounts",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    providerId: text("provider_id").notNull(),
    accountId: text("account_id").notNull(),
    refreshToken: text("refresh_token"),
    accessToken: text("access_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    idToken: text("id_token"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    password: text("password"),
  },
  (table) => [unique("accounts_provider_account_unique").on(table.providerId, table.accountId)],
);

export const session = pgTable("sessions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  token: text("token").notNull().unique(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
});

/** Legacy NextAuth-shaped table. Not used by better-auth or any code in src/. */
export const verificationToken = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull().unique(),
    expires: timestamp("expires", { withTimezone: true }).notNull(),
  },
  (table) => [
    unique("verification_tokens_identifier_token_unique").on(table.identifier, table.token),
  ],
);

/** The table better-auth's drizzleAdapter actually uses for verification flows. */
export const verification = pgTable("verification", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const customRole = pgTable("custom_roles", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull().unique(),
  displayName: text("display_name"),
  description: text("description"),
  /** Array of permission strings, e.g. ["events:create", "events:publish"]. */
  permissions: jsonb("permissions").notNull(),
  isSystem: boolean("is_system").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const userRoleAssignment = pgTable(
  "user_role_assignments",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    roleId: text("role_id")
      .notNull()
      .references(() => customRole.id, { onDelete: "cascade" }),
    assignedBy: text("assigned_by"),
    assignedAt: timestamp("assigned_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    isActive: boolean("is_active").notNull().default(true),
  },
  (table) => [unique("user_role_assignments_user_role_unique").on(table.userId, table.roleId)],
);

export const roleChangeHistory = pgTable("role_change_history", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  previousRole: text("previous_role").notNull(),
  newRole: text("new_role").notNull(),
  changedBy: text("changed_by").notNull(),
  changedAt: timestamp("changed_at", { withTimezone: true }).notNull().defaultNow(),
  reason: text("reason"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  roleId: text("role_id").references(() => customRole.id),
});

export const authLog = pgTable("auth_logs", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  // Cascades with the user row, same as every other per-user table in
  // this schema. Without it, better-auth's deleteUser hard-delete fails
  // with a foreign-key violation for any user whose role was ever
  // changed — a self-service account deletion broken by the audit trail
  // meant to record it. The trade (audit rows die with their user)
  // matches the retention stance the rest of this schema already took.
  userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
  eventType: text("event_type").notNull(),
  severity: text("severity").notNull(),
  message: text("message").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  deviceId: text("device_id"),
  location: text("location"),
  metadata: jsonb("metadata"),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
});

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export const customRoleRelations = relations(customRole, ({ many }) => ({
  users: many(userRoleAssignment),
  roleHistory: many(roleChangeHistory),
}));

export const userRoleAssignmentRelations = relations(userRoleAssignment, ({ one }) => ({
  user: one(user, { fields: [userRoleAssignment.userId], references: [user.id] }),
  role: one(customRole, { fields: [userRoleAssignment.roleId], references: [customRole.id] }),
}));

export const roleChangeHistoryRelations = relations(roleChangeHistory, ({ one }) => ({
  user: one(user, { fields: [roleChangeHistory.userId], references: [user.id] }),
  role: one(customRole, { fields: [roleChangeHistory.roleId], references: [customRole.id] }),
}));

export const authLogRelations = relations(authLog, ({ one }) => ({
  createdBy: one(user, { fields: [authLog.userId], references: [user.id] }),
}));

export type Account = typeof account.$inferSelect;
export type Session = typeof session.$inferSelect;
export type Verification = typeof verification.$inferSelect;
export type CustomRole = typeof customRole.$inferSelect;
export type NewCustomRole = typeof customRole.$inferInsert;
export type UserRoleAssignment = typeof userRoleAssignment.$inferSelect;
export type RoleChangeHistory = typeof roleChangeHistory.$inferSelect;
export type AuthLog = typeof authLog.$inferSelect;
export type NewAuthLog = typeof authLog.$inferInsert;
