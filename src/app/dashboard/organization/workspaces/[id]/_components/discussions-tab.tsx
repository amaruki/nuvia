import { formatDistanceToNow } from "date-fns";
import { MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { CommitteeWorkspace } from "@/types/committee";
import { getDiscussionStatusBadge } from "./status-badges";

interface DiscussionsTabProps {
  workspace: CommitteeWorkspace;
}

export function DiscussionsTab({ workspace }: DiscussionsTabProps) {
  return (
    <TabsContent value="discussions" className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Workspace Discussions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {workspace.discussions.map((discussion) => (
              <div
                key={discussion.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                    <MessageSquare className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{discussion.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {discussion.replyCount} replies • {discussion.viewCount} views
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Started {formatDistanceToNow(discussion.createdAt, { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    {getDiscussionStatusBadge(discussion.status)}
                    {discussion.isPinned && (
                      <Badge variant="outline" className="text-xs">
                        Pinned
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {workspace.discussions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No discussions in this workspace yet</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
