import { Star, TrendingUp, Users } from "lucide-react";

import { WidgetContainer } from "@/components/ui/widget-container";

interface StatsOverviewProps {
  totalMembers: number;
  activeTiers: number;
}

export function StatsOverview({ totalMembers, activeTiers }: StatsOverviewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <WidgetContainer
        title="Total Members"
        description="Across all membership tiers"
        size="small"
        type="member-statistics"
      >
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">{totalMembers.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">+12% from last month</p>
          </div>
        </div>
      </WidgetContainer>

      <WidgetContainer
        title="Active Tiers"
        description="Currently available membership options"
        size="small"
        type={"user-profile"}
      >
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-2xl font-bold">{activeTiers}</p>
            <p className="text-sm text-muted-foreground">All tiers active</p>
          </div>
        </div>
      </WidgetContainer>

      <WidgetContainer
        title="Most Popular"
        description="Highest member count"
        size="small"
        type={"user-profile"}
      >
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <Star className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p className="text-2xl font-bold">Professional</p>
            <p className="text-sm text-muted-foreground">892 members</p>
          </div>
        </div>
      </WidgetContainer>
    </div>
  );
}
