import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { Users } from "lucide-react";
import type { Committee, CommitteeMember } from "@/types/committee.types";

interface CommitteeMembersTabProps {
  committee: Committee;
}

export function CommitteeMembersTab({ committee }: CommitteeMembersTabProps) {
  return (
    <TabsContent value="members" className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Committee Members</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {committee.members.map((member) => (
              <MemberCard key={member.id} member={member} />
            ))}
            {committee.members.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No members assigned yet</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}

function MemberCard({ member }: { member: CommitteeMember }) {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={member.avatar} alt={member.name} />
          <AvatarFallback>
            {member.name
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium">{member.name}</p>
          <p className="text-sm text-muted-foreground">
            Joined {formatDistanceToNow(member.joinDate, { addSuffix: true })}
          </p>
          {member.expertise && member.expertise.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {member.expertise.slice(0, 3).map((skill, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {skill}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="text-right">
        <div className="flex items-center gap-2">
          <Badge variant={member.isActive ? "default" : "secondary"}>
            {member.isActive ? "Active" : "Inactive"}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {member.contributionLevel}
          </Badge>
        </div>
      </div>
    </div>
  );
}
