import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { Briefcase } from "lucide-react";
import type { Committee, CommitteeLeadership } from "@/types/committee.types";

interface CommitteeLeadershipTabProps {
  committee: Committee;
}

export function CommitteeLeadershipTab({ committee }: CommitteeLeadershipTabProps) {
  return (
    <TabsContent value="leadership" className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Committee Leadership</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {committee.leadership.map((leader) => (
              <LeadershipCard key={leader.id} leader={leader} />
            ))}
            {committee.leadership.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No leadership assigned yet</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}

function LeadershipCard({ leader }: { leader: CommitteeLeadership }) {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={leader.avatar} alt={leader.name} />
          <AvatarFallback>
            {leader.name
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium">{leader.name}</p>
          <p className="text-sm text-muted-foreground">{leader.title}</p>
          <p className="text-xs text-muted-foreground">
            Since {formatDistanceToNow(leader.startDate, { addSuffix: true })}
          </p>
        </div>
      </div>
      <div className="text-right">
        <Badge variant={leader.isActive ? "default" : "secondary"}>
          {leader.isActive ? "Active" : "Inactive"}
        </Badge>
      </div>
    </div>
  );
}
