import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { Calendar, Clock, MapPin, Users } from "lucide-react";
import type { Committee, CommitteeMeeting } from "@/types/committee";

interface CommitteeMeetingsTabProps {
  committee: Committee;
}

export function CommitteeMeetingsTab({ committee }: CommitteeMeetingsTabProps) {
  return (
    <TabsContent value="meetings" className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Meetings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {committee.meetings.map((meeting) => (
              <MeetingCard key={meeting.id} meeting={meeting} />
            ))}
            {committee.meetings.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No meetings scheduled yet</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}

function MeetingCard({ meeting }: { meeting: CommitteeMeeting }) {
  return (
    <div className="p-4 border rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium">{meeting.title}</h4>
        <Badge variant={meeting.isVirtual ? "outline" : "default"}>
          {meeting.isVirtual ? "Virtual" : "In-Person"}
        </Badge>
      </div>
      <div className="grid gap-2 md:grid-cols-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span>{meeting.date.toLocaleDateString()}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span>{meeting.duration} minutes</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          <span>{meeting.location}</span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span>{meeting.attendanceCount} attendees</span>
        </div>
      </div>
      {meeting.agenda && meeting.agenda.length > 0 && (
        <div className="mt-3">
          <h5 className="text-sm font-medium mb-1">Agenda</h5>
          <ul className="space-y-1">
            {meeting.agenda.slice(0, 3).map((item, index) => (
              <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-primary">•</span>
                {item}
              </li>
            ))}
            {meeting.agenda.length > 3 && (
              <li className="text-sm text-muted-foreground">
                +{meeting.agenda.length - 3} more items
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
