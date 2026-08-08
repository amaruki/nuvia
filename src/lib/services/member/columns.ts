/**
 * Column projections the member directory reads — the user column subset
 * shared by the listing and detail queries, and the columns the listing
 * knows how to sort by.
 */

import { user, type User } from "@/db/schema";

/** Columns this service reads from the users table. */
export const userColumns = {
  id: user.id,
  username: user.username,
  email: user.email,
  name: user.name,
  firstName: user.firstName,
  lastName: user.lastName,
  image: user.image,
  profilePhoto: user.profilePhoto,
  bio: user.bio,
  role: user.role,
  emailVerified: user.emailVerified,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
};

/** The subset of user columns this service selects. */
export type UserRow = Pick<
  User,
  | "id"
  | "username"
  | "email"
  | "name"
  | "firstName"
  | "lastName"
  | "image"
  | "profilePhoto"
  | "bio"
  | "role"
  | "emailVerified"
  | "createdAt"
  | "updatedAt"
>;

/** Sort fields the member listing understands. */
export const SORT_COLUMNS = {
  name: user.name,
  username: user.username,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt,
} as const;
