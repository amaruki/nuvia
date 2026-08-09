/**
 * Member analytics aggregates (UI-23) — signup growth by month, role
 * distribution, and a login-activity proxy, computed from `users` and
 * `user_login_activities`.
 *
 * Aggregate counts only: the role distribution buckets users by role and
 * the activity section counts login attempts — nothing here ever surfaces
 * individual members. Soft-deleted users are excluded everywhere.
 */

import { gte, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { user, userLoginActivity } from "@/db/schema";
import { eachUtcMonth, utcMonthKey, utcMonthLabel } from "./analytics-range";

const MEMBER_SCAN_ROWS = 100_000;
const LOGIN_SCAN_ROWS = 100_000;
const DEFAULT_GROWTH_MONTHS = 12;

export interface MemberSignupPoint {
  period: string;
  label: string;
  signups: number;
}

export interface RoleDistributionCount {
  role: string;
  count: number;
}

export interface LoginActivityMonthPoint {
  period: string;
  label: string;
  logins: number;
}

export interface LoginActivitySummary {
  total: number;
  successful: number;
  failed: number;
  byMonth: LoginActivityMonthPoint[];
}

export interface MemberAnalytics {
  totalMembers: number;
  /** Signups inside the window (users.createdAt). */
  signupsInWindow: number;
  /** Continuous month series covering the window. */
  signupsByMonth: MemberSignupPoint[];
  /** Aggregate counts per role, largest first — never individual members. */
  roleDistribution: RoleDistributionCount[];
  /** Login attempts inside the window (the activity proxy). */
  loginActivity: LoginActivitySummary;
}

export async function getMemberAnalytics(opts?: {
  since?: Date;
  now?: Date;
}): Promise<MemberAnalytics> {
  const now = opts?.now ?? new Date();
  const since =
    opts?.since ??
    new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (DEFAULT_GROWTH_MONTHS - 1), 1));

  const [userRows, loginRows] = await Promise.all([
    db
      .select({ role: user.role, createdAt: user.createdAt })
      .from(user)
      .where(isNull(user.deletedAt))
      .limit(MEMBER_SCAN_ROWS),
    db
      .select({ loginAt: userLoginActivity.loginAt, successful: userLoginActivity.successful })
      .from(userLoginActivity)
      .where(gte(userLoginActivity.loginAt, since))
      .limit(LOGIN_SCAN_ROWS),
  ]);

  const roleCounts = new Map<string, number>();
  const signupCounts = new Map<string, number>();
  let signupsInWindow = 0;
  for (const row of userRows) {
    roleCounts.set(row.role, (roleCounts.get(row.role) ?? 0) + 1);
    if (row.createdAt.getTime() >= since.getTime()) {
      signupsInWindow += 1;
      const key = utcMonthKey(row.createdAt);
      signupCounts.set(key, (signupCounts.get(key) ?? 0) + 1);
    }
  }

  const signupsByMonth: MemberSignupPoint[] = eachUtcMonth(since, now).map((key) => ({
    period: key,
    label: utcMonthLabel(key),
    signups: signupCounts.get(key) ?? 0,
  }));

  const roleDistribution: RoleDistributionCount[] = [...roleCounts.entries()]
    .map(([role, count]) => ({ role, count }))
    .sort((a, b) => b.count - a.count);

  let successful = 0;
  let failed = 0;
  const loginCounts = new Map<string, number>();
  for (const row of loginRows) {
    if (row.successful) successful += 1;
    else failed += 1;
    const key = utcMonthKey(row.loginAt);
    loginCounts.set(key, (loginCounts.get(key) ?? 0) + 1);
  }
  const loginByMonth: LoginActivityMonthPoint[] = eachUtcMonth(since, now).map((key) => ({
    period: key,
    label: utcMonthLabel(key),
    logins: loginCounts.get(key) ?? 0,
  }));

  return {
    totalMembers: userRows.length,
    signupsInWindow,
    signupsByMonth,
    roleDistribution,
    loginActivity: {
      total: loginRows.length,
      successful,
      failed,
      byMonth: loginByMonth,
    },
  };
}
