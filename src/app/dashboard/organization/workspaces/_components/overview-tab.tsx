import { Activity, FolderOpen } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { TabsContent } from "@/components/ui/tabs";
import type { CommitteeWorkspace } from "@/types/committee";

interface OverviewTabProps {
  workspaces: CommitteeWorkspace[];
}

export function OverviewTab({ workspaces }: OverviewTabProps) {
  return (
    <TabsContent value="overview" className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Workspace Status Summary */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Workspace Status Summary</h3>
          <div className="space-y-3">
            {workspaces.map((workspace) => (
              <div
                key={workspace.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                    <FolderOpen className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{workspace.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {workspace.type.replace("_", " ")}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge
                    variant={
                      workspace.status === "active"
                        ? "default"
                        : workspace.status === "archived"
                          ? "secondary"
                          : "destructive"
                    }
                  >
                    {workspace.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Recent Activity</h3>
          <div className="space-y-3">
            {workspaces.slice(0, 3).map((workspace) => (
              <div
                key={workspace.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                    <Activity className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{workspace.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {workspace.members.length} members • {workspace.documents.length} documents
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">{workspace.activity.length}</p>
                  <p className="text-xs text-muted-foreground">activities</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Document Management</h3>
          <div className="space-y-3">
            {workspaces.slice(0, 3).map((workspace) => (
              <div
                key={workspace.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="min-w-0 flex-1 mr-2">
                  <p className="font-medium">{workspace.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {workspace.members.length} members • {workspace.documents.length} documents
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-bold">{workspace.documents.length}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Task Management</h3>
          <div className="space-y-3">
            {workspaces.slice(0, 3).map((workspace) => (
              <div
                key={workspace.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="min-w-0 flex-1 mr-2">
                  <p className="font-medium">{workspace.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {workspace.tasks.length} tasks •{" "}
                    {workspace.tasks.filter((t) => t.status === "completed").length} completed
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-bold">{workspace.tasks.length}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </TabsContent>
  );
}
