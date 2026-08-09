/**
 * Permissions seam: user-model fields and account lifecycle controls.
 * `role` is declared with `input: false` so users can never set their own
 * role; role changes go through the RBAC layer instead.
 *
 * Split out of the old monolithic src/lib/auth.ts.
 */

import type { BetterAuthOptions } from "better-auth";

// User fields configuration
export const userOptions = {
  additionalFields: {
    username: {
      type: "string",
      required: true,
      unique: true,
    },
    displayName: {
      type: "string",
      required: false,
    },
    profilePhoto: {
      type: "string",
      required: false,
    },
    bio: {
      type: "string",
      required: false,
    },
    externalLinks: {
      type: "json",
      required: false,
    },
    /**
     * Public-profile opt-in (UI-28, decision D7). Declared here so the
     * existing profile-update path (`auth.api.updateUser`) can persist the
     * dashboard visibility toggle. No `input: false` — unlike `role`, this
     * one is the member's own choice. Default off = private by default.
     */
    profilePublic: {
      type: "boolean",
      required: false,
      defaultValue: false,
    },
    role: {
      type: "string",
      required: false,
      defaultValue: "user",
      input: false, // Critical: Users cannot set their own role
    },
  },
  // Hard-deletes the user row (cascades to sessions, accounts, active
  // devices, login activity, password reset tokens, and role-change
  // history via each table's onDelete: "cascade" FK). Will start
  // throwing a foreign-key violation for any user who has authored
  // content/events/forum posts/job postings once those M3 domains move
  // off mock data onto real Drizzle tables — those FKs are NOT NULL
  // with no cascade today. Revisit then (anonymize instead of delete,
  // or reassign authorship) rather than assuming this stays safe.
  deleteUser: {
    enabled: true,
  },
} satisfies BetterAuthOptions["user"];
