/**
 * Cross-domain relations for `user`.
 *
 * Drizzle's relational query API (`db.query.user.findFirst({ with: {...} })`)
 * needs BOTH sides of a relation declared. Each domain file already declares
 * the "many→one" side pointing *into* `user` (e.g. accountRelations in
 * auth.ts); this file declares the single "one→many" side pointing *out* of
 * `user`, matching every relation the original Prisma `User` model had.
 * It lives separately, not in users.ts, purely to avoid a circular import
 * (every domain file imports `user` from users.ts; users.ts can't import
 * back from all of them).
 */

import { relations } from "drizzle-orm";
import { authLog, account, roleChangeHistory, session, userRoleAssignment } from "./auth";
import { chapterMember } from "./chapters";
import { content } from "./content";
import { event, eventRegistration } from "./events";
import { forumComment, forumPost } from "./forum";
import { jobApplication, jobPosting } from "./jobs";
import { membershipSubscription, membershipTransaction } from "./membership";
import { activeDevice, passwordResetToken, user, userLoginActivity } from "./users";

export const userRelations = relations(user, ({ many }) => ({
  loginActivities: many(userLoginActivity),
  activeDevices: many(activeDevice),
  passwordResetTokens: many(passwordResetToken),
  accounts: many(account),
  sessions: many(session),
  roleAssignments: many(userRoleAssignment),
  roleHistory: many(roleChangeHistory),
  createdAuthLogs: many(authLog),
  membershipSubscriptions: many(membershipSubscription),
  membershipTransactions: many(membershipTransaction),
  eventRegistrations: many(eventRegistration),
  createdEvents: many(event),
  forumPosts: many(forumPost),
  forumComments: many(forumComment),
  createdContent: many(content),
  postedJobs: many(jobPosting),
  jobApplications: many(jobApplication),
  chapterMemberships: many(chapterMember),
}));
