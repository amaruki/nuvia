import { Card, CardContent } from "@/components/ui/card";
import { Calendar, CheckSquare, Target, Users } from "lucide-react";
import type { Committee } from "@/types/committee.types";
import { formatPercentage } from "./committee-helpers";

interface CommitteeQuickStatsProps {
  committee: Committee;
}

export function CommitteeQuickStats({ committee }: CommitteeQuickStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardContent className="p-6 text-center">
          <Users className="h-8 w-8 mx-auto mb-2 text-blue-500" />
          <div className="text-2xl font-bold">{committee.metrics.memberCount}</div>
          <p className="text-sm text-muted-foreground">Total Members</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 text-center">
          <CheckSquare className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
          <div className="text-2xl font-bold">{committee.metrics.activeMembersCount}</div>
          <p className="text-sm text-muted-foreground">Active Members</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 text-center">
          <Calendar className="h-8 w-8 mx-auto mb-2 text-purple-500" />
          <div className="text-2xl font-bold">
            {formatPercentage(committee.metrics.meetingAttendanceRate)}
          </div>
          <p className="text-sm text-muted-foreground">Meeting Attendance</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 text-center">
          <Target className="h-8 w-8 mx-auto mb-2 text-orange-500" />
          <div className="text-2xl font-bold">
            {formatPercentage(committee.metrics.goalCompletionRate)}
          </div>
          <p className="text-sm text-muted-foreground">Goal Completion</p>
        </CardContent>
      </Card>
    </div>
  );
}
