import { TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Target } from "lucide-react";
import type { Committee, CommitteeOverallStatistics } from "@/types/committee";

interface CommitteesOverviewTabProps {
  committees: Committee[];
  statistics?: CommitteeOverallStatistics;
}

export function CommitteesOverviewTab({ committees, statistics }: CommitteesOverviewTabProps) {
  return (
    <TabsContent value="overview" className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Committee Status Summary */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Committee Status Summary</h3>
          <div className="space-y-3">
            {committees.map((committee) => (
              <div
                key={committee.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                    <Briefcase className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{committee.displayName}</p>
                    <p className="text-sm text-muted-foreground">
                      {committee.type.replace("_", " ")}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge
                    variant={
                      committee.status === "active"
                        ? "default"
                        : committee.status === "inactive"
                          ? "secondary"
                          : committee.status === "pending"
                            ? "outline"
                            : "destructive"
                    }
                  >
                    {committee.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Performance Highlights</h3>
          <div className="space-y-3">
            {statistics?.topPerformingCommittees.slice(0, 3).map((committee) => (
              <div
                key={committee.committeeId}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                    <Target className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{committee.committeeName}</p>
                    <p className="text-sm text-muted-foreground">
                      {committee.type.replace("_", " ")} • {committee.memberCount} members
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">{committee.impactScore.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">impact score</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      {statistics && (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Goal Completion</h3>
            <div className="space-y-3">
              {statistics.topPerformingCommittees.slice(0, 3).map((committee) => (
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
                    <p
                      className={`text-lg font-bold ${
                        committee.goalCompletionRate >= 80
                          ? "text-emerald-700 dark:text-emerald-400"
                          : "text-amber-700 dark:text-amber-400"
                      }`}
                    >
                      {committee.goalCompletionRate.toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Meeting Attendance</h3>
            <div className="space-y-3">
              {statistics.topPerformingCommittees.slice(0, 3).map((committee) => (
                <div
                  key={committee.committeeId}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="min-w-0 flex-1 mr-2">
                    <p className="font-medium">{committee.committeeName}</p>
                    <p className="text-sm text-muted-foreground">
                      {committee.type.replace("_", " ")} • {committee.memberCount} members
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold">
                      {committee.meetingAttendanceRate.toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground">attendance rate</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </TabsContent>
  );
}
