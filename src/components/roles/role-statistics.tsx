/**
 * Role Statistics
 *
 * Dashboard component showing role distribution, user counts,
 * and analytics for the role management system.
 */

"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  Shield,
  TrendingUp,
  Activity,
  UserCheck,
  UserX,
  AlertTriangle,
  Crown,
  Building,
  Briefcase,
  GraduationCap,
} from "lucide-react";
// Chart components (requires recharts dependency)
// import {
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   ResponsiveContainer,
//   PieChart,
//   Pie,
//   Cell,
//   Legend
// } from 'recharts';
import { Role, ROLE_DISPLAY_INFO } from "@/types/role.types";

// Statistics data interface
export interface RoleStatisticsData {
  totalUsers: number;
  roleDistribution: Record<Role, number>;
  roleBreakdown: Array<{
    role: Role;
    count: number;
    percentage: number;
    displayName: string;
    description: string;
    category: string;
  }>;
}

// Props interface
interface RoleStatisticsProps {
  data?: RoleStatisticsData;
  loading?: boolean;
}

// Color palette for charts
const CHART_COLORS = [
  "#3b82f6", // blue
  "#ef4444", // red
  "#10b981", // green
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
  "#6366f1", // indigo
  "#84cc16", // lime
  "#14b8a6", // teal
  "#a855f7", // purple
  "#64748b", // slate
  "#0ea5e9", // sky
];

export function RoleStatistics({ data, loading = false }: RoleStatisticsProps) {
  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded animate-pulse mb-2" />
              <div className="h-3 bg-muted rounded animate-pulse w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <div className="text-center text-muted-foreground">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            <p>No statistics data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { totalUsers, roleDistribution, roleBreakdown } = data;

  // Prepare data for charts
  const barChartData = roleBreakdown.map((item) => ({
    role: item.displayName,
    count: item.count,
    percentage: item.percentage,
    category: item.category,
  }));

  const pieChartData = roleBreakdown
    .filter((item) => item.count > 0)
    .map((item, index) => ({
      name: item.displayName,
      value: item.count,
      color: CHART_COLORS[index % CHART_COLORS.length],
    }));

  // Calculate key metrics
  const adminUsers = (roleDistribution.admin || 0) + (roleDistribution.superadmin || 0);
  const staffUsers = (roleDistribution.staff || 0) + (roleDistribution.treasurer || 0);
  const leadershipUsers =
    (roleDistribution.chapter_president || 0) +
    (roleDistribution.chapter_admin || 0) +
    (roleDistribution.committee_chair || 0);
  const memberUsers =
    totalUsers - adminUsers - staffUsers - leadershipUsers - (roleDistribution.user || 0);
  const regularUsers = roleDistribution.user || 0;

  // Get category-wise breakdown
  const categoryBreakdown = roleBreakdown.reduce(
    (acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = { count: 0, roles: [] };
      }
      acc[item.category].count += item.count;
      acc[item.category].roles.push(item);
      return acc;
    },
    {} as Record<string, { count: number; roles: any[] }>,
  );

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
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
            <Shield className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{adminUsers}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((adminUsers / totalUsers) * 100)}% of total users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leadership</CardTitle>
            <Crown className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{leadershipUsers}</div>
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

      {/* Role Distribution List */}
      <Card>
        <CardHeader>
          <CardTitle>Role Distribution</CardTitle>
          <CardDescription>Number of users per role</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {barChartData.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded">
                <span className="font-medium">{item.role}</span>
                <div className="text-right">
                  <div className="font-bold">{item.count}</div>
                  <div className="text-sm text-muted-foreground">{item.percentage}%</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Category Breakdown</CardTitle>
          <CardDescription>User distribution by role category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(categoryBreakdown).map(([category, data]) => {
              const percentage = Math.round((data.count / totalUsers) * 100);
              const getCategoryIcon = (cat: string) => {
                switch (cat) {
                  case "administrative":
                    return <Shield className="h-4 w-4" />;
                  case "leadership":
                    return <Crown className="h-4 w-4" />;
                  case "staff":
                    return <Users className="h-4 w-4" />;
                  case "membership":
                    return <UserCheck className="h-4 w-4" />;
                  default:
                    return <Users className="h-4 w-4" />;
                }
              };

              const getCategoryColor = (cat: string) => {
                switch (cat) {
                  case "administrative":
                    return "text-red-600";
                  case "leadership":
                    return "text-purple-600";
                  case "staff":
                    return "text-blue-600";
                  case "membership":
                    return "text-green-600";
                  default:
                    return "text-gray-600";
                }
              };

              return (
                <div key={category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(category)}
                      <span className="font-medium capitalize">{category}</span>
                      <Badge variant="outline">{data.roles.length} roles</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {data.count} users ({percentage}%)
                    </div>
                  </div>
                  <Progress value={percentage} className="h-2" />
                  <div className="flex flex-wrap gap-1">
                    {data.roles.map((role, index) => (
                      <Badge key={role.role} variant="outline" className="text-xs">
                        {role.displayName} ({role.count})
                      </Badge>
                    ))}
                  </div>
                  {category !==
                    Object.keys(categoryBreakdown)[Object.keys(categoryBreakdown).length - 1] && (
                    <div className="border-t pt-2" />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Role Details Table */}
      <Card>
        <CardHeader>
          <CardTitle>Role Details</CardTitle>
          <CardDescription>Complete breakdown of all roles and their user counts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="grid grid-cols-1 divide-y">
              {roleBreakdown.map((item) => {
                const roleInfo = ROLE_DISPLAY_INFO[item.role as keyof typeof ROLE_DISPLAY_INFO];
                const isCustom = !roleInfo;

                return (
                  <div key={item.role} className="p-4 hover:bg-muted/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Badge variant={isCustom ? "secondary" : "outline"}>{item.role}</Badge>
                          {isCustom && (
                            <Badge variant="outline" className="text-xs">
                              Custom
                            </Badge>
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{roleInfo?.name || item.role}</div>
                          <div className="text-sm text-muted-foreground">
                            {roleInfo?.description || "Custom role"}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{item.count.toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.percentage}% of users
                        </div>
                      </div>
                    </div>
                    {item.count > 0 && (
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-1">
                          <div
                            className="bg-blue-600 h-1 rounded-full"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
