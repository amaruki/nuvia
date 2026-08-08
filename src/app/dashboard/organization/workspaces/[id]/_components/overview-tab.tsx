import { formatDistanceToNow } from "date-fns";
import { Activity, CheckSquare, Clock, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { CommitteeWorkspace } from "@/types/committee";
import { getStatusBadge, getTypeBadge } from "./status-badges";

interface OverviewTabProps {
  workspace: CommitteeWorkspace;
}

export function OverviewTab({ workspace }: OverviewTabProps) {
  return (
    <TabsContent value="overview" className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status</span>
              {getStatusBadge(workspace.status)}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Type</span>
              {getTypeBadge(workspace.type)}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Visibility</span>
              <Badge variant={workspace.settings.isPublic ? "default" : "secondary"}>
                {workspace.settings.isPublic ? "Public" : "Private"}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Created</span>
              <span className="text-sm text-muted-foreground">
                {formatDistanceToNow(workspace.createdAt, { addSuffix: true })}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Last Updated</span>
              <span className="text-sm text-muted-foreground">
                {formatDistanceToNow(workspace.updatedAt, { addSuffix: true })}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Workspace Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Guest Access</span>
              </div>
              <Badge variant={workspace.settings.allowGuestAccess ? "default" : "secondary"}>
                {workspace.settings.allowGuestAccess ? "Allowed" : "Not Allowed"}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Approval Required</span>
              </div>
              <Badge variant={workspace.settings.requireApproval ? "default" : "secondary"}>
                {workspace.settings.requireApproval ? "Required" : "Not Required"}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium">Notifications</span>
              </div>
              <Badge variant={workspace.settings.enableNotifications ? "default" : "secondary"}>
                {workspace.settings.enableNotifications ? "Enabled" : "Disabled"}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium">Auto Archive</span>
              </div>
              <span className="text-sm font-medium">{workspace.settings.autoArchiveDays} days</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {workspace.activity.slice(0, 5).map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                    <Activity className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{activity.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {activity.type.replace("_", " ")} • {activity.targetType}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(activity.createdAt, { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
