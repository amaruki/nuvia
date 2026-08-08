import { TabsContent } from "@/components/ui/tabs";
import type { CommitteeOverallStatistics } from "@/types/committee";

interface CommitteesAnalyticsTabProps {
  statistics?: CommitteeOverallStatistics;
}

export function CommitteesAnalyticsTab({ statistics }: CommitteesAnalyticsTabProps) {
  return (
    <TabsContent value="analytics" className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Committee Performance */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Committee Performance</h3>
          <div className="space-y-3">
            {statistics?.topPerformingCommittees.map((committee) => (
              <div
                key={committee.committeeId}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="min-w-0 flex-1 mr-2">
                  <p className="font-medium">{committee.committeeName}</p>
                  <p className="text-sm text-muted-foreground">
                    {committee.memberCount} members • {committee.deliverablesCount} deliverables
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-bold">{committee.impactScore.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">impact score</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Type Analytics */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Committee Types</h3>
          <div className="space-y-3">
            {statistics?.typeBreakdown.map((type) => (
              <div
                key={type.type}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="min-w-0 flex-1 mr-2">
                  <p className="font-medium capitalize">{type.type.replace("_", " ")}</p>
                  <p className="text-sm text-muted-foreground">{type.committeeCount} committees</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-bold">{type.averageImpactScore.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">avg impact score</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Trends */}
      {statistics?.monthlyTrend && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Monthly Trends</h3>
          <div className="space-y-3">
            {statistics.monthlyTrend.slice(0, 6).map((trend, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="min-w-0 flex-1 mr-2">
                  <p className="font-medium">{trend.month}</p>
                  <p className="text-sm text-muted-foreground">
                    {trend.meetingCount} meetings • {trend.memberCount} members
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-bold">{trend.goalsCompleted}</p>
                  <p className="text-xs text-muted-foreground">goals completed</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </TabsContent>
  );
}
