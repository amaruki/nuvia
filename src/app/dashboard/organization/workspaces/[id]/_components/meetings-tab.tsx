import { Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { CommitteeWorkspace } from "@/types/committee";
import { getMeetingStatusBadge } from "./status-badges";

interface MeetingsTabProps {
  workspace: CommitteeWorkspace;
}

export function MeetingsTab({ workspace }: MeetingsTabProps) {
  return (
    <TabsContent value="meetings" className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Workspace Meetings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {workspace.meetings.map((meeting) => (
              <div
                key={meeting.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                    <Calendar className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{meeting.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {meeting.attendees.length} attendees • {meeting.agenda.length} agenda items
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {meeting.startTime.toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    {getMeetingStatusBadge(meeting.status)}
                    {meeting.isVirtual && (
                      <Badge variant="outline" className="text-xs">
                        Virtual
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {workspace.meetings.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No meetings in this workspace yet</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
