import { CheckSquare, FileText, MessageSquare, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { CommitteeWorkspace } from "@/types/committee.types";

interface WorkspaceStatsProps {
  workspace: CommitteeWorkspace;
}

export function WorkspaceStats({ workspace }: WorkspaceStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardContent className="p-6 text-center">
          <Users className="h-8 w-8 mx-auto mb-2 text-blue-500" />
          <div className="text-2xl font-bold">{workspace.members.length}</div>
          <p className="text-sm text-muted-foreground">Total Members</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 text-center">
          <FileText className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
          <div className="text-2xl font-bold">{workspace.documents.length}</div>
          <p className="text-sm text-muted-foreground">Documents</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 text-center">
          <CheckSquare className="h-8 w-8 mx-auto mb-2 text-purple-500" />
          <div className="text-2xl font-bold">{workspace.tasks.length}</div>
          <p className="text-sm text-muted-foreground">Tasks</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 text-center">
          <MessageSquare className="h-8 w-8 mx-auto mb-2 text-orange-500" />
          <div className="text-2xl font-bold">{workspace.discussions.length}</div>
          <p className="text-sm text-muted-foreground">Discussions</p>
        </CardContent>
      </Card>
    </div>
  );
}
