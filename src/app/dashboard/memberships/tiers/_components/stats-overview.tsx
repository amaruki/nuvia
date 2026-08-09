import { Layers, Users } from "lucide-react";

import { WidgetContainer } from "@/components/ui/widget-container";

interface StatsOverviewProps {
  /** Sum of ACTIVE subscriptions across all tiers (from the API). */
  totalActiveMembers: number;
  /** Number of tiers currently marked active. */
  activeTiers: number;
}

export function StatsOverview({ totalActiveMembers, activeTiers }: StatsOverviewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <WidgetContainer
        title="Active Members"
        description="Active subscriptions across all tiers"
        size="small"
        type="member-statistics"
      >
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">{totalActiveMembers.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Live count from subscriptions</p>
          </div>
        </div>
      </WidgetContainer>

      <WidgetContainer
        title="Active Tiers"
        description="Currently available membership options"
        size="small"
        type="user-profile"
      >
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-success/15 rounded-lg">
            <Layers className="w-6 h-6 text-success" />
          </div>
          <div>
            <p className="text-2xl font-bold">{activeTiers}</p>
            <p className="text-sm text-muted-foreground">Inactive tiers stay listed</p>
          </div>
        </div>
      </WidgetContainer>
    </div>
  );
}
