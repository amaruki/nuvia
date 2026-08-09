"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Crown, Shield, Users } from "lucide-react";
import type { RoleStatisticsSectionProps } from "./types";

export function OverviewCards({ data }: RoleStatisticsSectionProps) {
  const { totalUsers, roleDistribution, roleBreakdown } = data;
  const adminUsers = (roleDistribution.admin || 0) + (roleDistribution.superadmin || 0);
  const leadershipUsers =
    (roleDistribution.chapter_president || 0) +
    (roleDistribution.chapter_admin || 0) +
    (roleDistribution.committee_chair || 0);

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalUsers.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">Registered users in system</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Administrators</CardTitle>
          <Shield className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">{adminUsers}</div>
          <p className="text-xs text-muted-foreground">
            {Math.round((adminUsers / totalUsers) * 100)}% of total users
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Leadership</CardTitle>
          <Crown className="h-4 w-4 text-accent-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-accent-foreground">{leadershipUsers}</div>
          <p className="text-xs text-muted-foreground">Chapter and committee leaders</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Roles</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{roleBreakdown.length}</div>
          <p className="text-xs text-muted-foreground">Roles with assigned users</p>
        </CardContent>
      </Card>
    </div>
  );
}
