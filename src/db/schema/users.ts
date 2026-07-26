/**
 * User management — translated 1:1 from prisma/schema.prisma's
 * "USER MANAGEMENT MODELS" section. Column names, nullability, defaults,
 * unique constraints and indexes are preserved exactly; only the syntax
 * changed. See docs/adr/0011-prisma-to-drizzle.md.
 */

import { relations } from "drizzle-orm";
import { boolean, index, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const user = pgTable(
  "users",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    username: text("username").notNull().unique(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").notNull().default(false),
    firstName: text("first_name"),
    lastName: text("last_name"),
    profilePhoto: text("profile_photo"),
    bio: text("bio"),
    externalLinks: jsonb("external_links"),
    role: text("role").notNull().default("user"),
    passwordHash: text("password_hash"),
    emailVerificationToken: text("email_verification_token").unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    name: text("name").notNull(),
    image: text("image"),
    displayName: text("display_name"),
  },
  (table) => [
    index("users_username_idx").on(table.username),
    index("users_email_idx").on(table.email),
    index("users_role_idx").on(table.role),
    index("users_deleted_at_idx").on(table.deletedAt),
  ],
);

export const userLoginActivity = pgTable("user_login_activities", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  ipAddress: text("ip_address").notNull(),
  userAgent: text("user_agent"),
  deviceType: text("device_type"),
  location: text("location"),
  loginAt: timestamp("login_at", { withTimezone: true }).notNull().defaultNow(),
  successful: boolean("successful").notNull(),
});

export const activeDevice = pgTable(
  "active_devices",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    deviceId: text("device_id").notNull(),
    deviceName: text("device_name"),
    deviceType: text("device_type"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    lastActive: timestamp("last_active", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    isActive: boolean("is_active").notNull().default(true),
  },
  (table) => [index("active_devices_user_device_unique").on(table.userId, table.deviceId)],
);

export const passwordResetToken = pgTable("password_reset_tokens", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  used: boolean("used").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const userLoginActivityRelations = relations(userLoginActivity, ({ one }) => ({
  user: one(user, { fields: [userLoginActivity.userId], references: [user.id] }),
}));

export const activeDeviceRelations = relations(activeDevice, ({ one }) => ({
  user: one(user, { fields: [activeDevice.userId], references: [user.id] }),
}));

export const passwordResetTokenRelations = relations(passwordResetToken, ({ one }) => ({
  user: one(user, { fields: [passwordResetToken.userId], references: [user.id] }),
}));

export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;
export type UserLoginActivity = typeof userLoginActivity.$inferSelect;
export type ActiveDevice = typeof activeDevice.$inferSelect;
export type PasswordResetToken = typeof passwordResetToken.$inferSelect;
