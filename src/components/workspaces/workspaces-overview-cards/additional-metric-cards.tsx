import { Card, CardContent } from "@/components/ui/card";
import { Calendar, MessageSquare, Target } from "lucide-react";
import type { WorkspaceStatisticsCardProps } from "./types";
import { formatPercentage } from "./helpers";

export function DiscussionsCard({ statistics }: WorkspaceStatisticsCardProps) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <p className="text-sm font-medium text-muted-foreground">Discussions</p>
          <div className="h-8 w-8 rounded-full bg-cyan-50 flex items-center justify-center">
            <MessageSquare className="h-4 w-4 text-cyan-600" />
          </div>
        </div>
        <div className="flex flex-col mt-3">
          <span className="text-2xl font-bold">{statistics.totalDiscussions}</span>
          <span className="text-xs text-muted-foreground mt-1">Active conversations</span>
        </div>
      </CardContent>
    </Card>
  );
}

export function MeetingsCard({ statistics }: WorkspaceStatisticsCardProps) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <p className="text-sm font-medium text-muted-foreground">Meetings</p>
          <div className="h-8 w-8 rounded-full bg-orange-50 flex items-center justify-center">
            <Calendar className="h-4 w-4 text-orange-600" />
          </div>
        </div>
        <div className="flex flex-col mt-3">
          <span className="text-2xl font-bold">{statistics.totalMeetings}</span>
          <span className="text-xs text-muted-foreground mt-1">
            {formatPercentage(statistics.meetingAttendanceRate)} attendance
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export function TasksCard({ statistics }: WorkspaceStatisticsCardProps) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <p className="text-sm font-medium text-muted-foreground">Tasks</p>
          <div className="h-8 w-8 rounded-full bg-pink-50 flex items-center justify-center">
            <Target className="h-4 w-4 text-pink-600" />
          </div>
        </div>
        <div className="flex flex-col mt-3">
          <span className="text-2xl font-bold">{statistics.totalTasks}</span>
          <span className="text-xs text-muted-foreground mt-1">
            {formatPercentage(statistics.taskCompletionRate)} completed
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
