import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserStats as UserStatsType } from "@/types/user-management.types";
import {
  Users,
  UserCheck,
  UserX,
  Shield,
  Mail,
  Smartphone,
  Key,
  TrendingUp,
  Activity,
  Crown,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface UserStatsProps {
  stats: UserStatsType;
  className?: string;
}

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  className?: string;
}

function StatCard({ title, value, description, icon, trend, className }: StatCardProps) {
  return (
    <Card className={cn("hover:shadow-md transition-shadow", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="size-8 text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value.toLocaleString()}</div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        {trend && (
          <div className="flex items-center gap-1 mt-2">
            <TrendingUp
              className={cn("size-3", trend.isPositive ? "text-success" : "text-destructive")}
            />
            <span
              className={cn(
                "text-xs font-medium",
                trend.isPositive ? "text-success" : "text-destructive",
              )}
            >
              {trend.value}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function UserStats({ stats, className }: UserStatsProps) {
  const activePercentage =
    stats.totalUsers > 0 ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0;

  const verifiedPercentage =
    stats.totalUsers > 0 ? Math.round((stats.verifiedUsers / stats.totalUsers) * 100) : 0;

  const twoFactorPercentage =
    stats.totalUsers > 0 ? Math.round((stats.usersWithTwoFactor / stats.totalUsers) * 100) : 0;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Main Stats Grid - Mobile First */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          description="Registered accounts"
          icon={<Users className="size-4" />}
          trend={{
            value: `+${stats.newUsersThisMonth} this month`,
            isPositive: true,
          }}
        />

        <StatCard
          title="Active Users"
          value={stats.activeUsers}
          description={`${activePercentage}% of total users`}
          icon={<UserCheck className="size-4" />}
          trend={{
            value: `${stats.usersLastLogin30Days} in last 30 days`,
            isPositive: true,
          }}
        />

        <StatCard
          title="Verified Users"
          value={stats.verifiedUsers}
          description={`${verifiedPercentage}% verified`}
          icon={<ShieldCheck className="size-4" />}
          trend={{
            value: `${stats.unverifiedUsers} pending`,
            isPositive: false,
          }}
        />

        <StatCard
          title="2FA Enabled"
          value={stats.usersWithTwoFactor}
          description={`${twoFactorPercentage}% with 2FA`}
          icon={<Key className="size-4" />}
          trend={{
            value: `${twoFactorPercentage}% adoption`,
            isPositive: twoFactorPercentage > 50,
          }}
        />
      </div>

      {/* Additional Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Inactive Users"
          value={stats.inactiveUsers}
          description="Not recently active"
          icon={<UserX className="size-4" />}
        />

        <StatCard
          title="Suspended Users"
          value={stats.suspendedUsers}
          description="Account restricted"
          icon={<Shield className="size-4" />}
        />

        <StatCard
          title="Email Verified"
          value={stats.verifiedUsers}
          description="Email confirmed"
          icon={<Mail className="size-4" />}
        />

        <StatCard
          title="Phone Verified"
          value={stats.verifiedUsers}
          description="Phone confirmed"
          icon={<Smartphone className="size-4" />}
        />
      </div>

      {/* Role Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="size-5" />
            Role Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(stats.roleDistribution).map(([role, count]) => (
              <div key={role} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "size-2 rounded-full",
                      role === "admin" && "bg-chart-1",
                      role === "moderator" && "bg-chart-3",
                      role === "member" && "bg-chart-2",
                    )}
                  />
                  <span className="font-medium capitalize">{role}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{count}</span>
                  <Badge variant="secondary" className="text-xs">
                    {Math.round((count / stats.totalUsers) * 100)}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="size-5" />
            Quick Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
              <div>
                <p className="text-sm font-medium text-muted-foreground">User Health</p>
                <p className="text-lg font-bold text-success">{activePercentage}% Active</p>
              </div>
              <div className="size-10 rounded-full bg-success/15 flex items-center justify-center">
                <UserCheck className="size-5 text-success" />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Security Score</p>
                <p className="text-lg font-bold text-info">{twoFactorPercentage}% 2FA</p>
              </div>
              <div className="size-10 rounded-full bg-info/15 flex items-center justify-center">
                <Key className="size-5 text-info" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
