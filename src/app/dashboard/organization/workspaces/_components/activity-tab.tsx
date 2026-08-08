import { Activity } from "lucide-react";

import { TabsContent } from "@/components/ui/tabs";
import type { CommitteeWorkspace } from "@/types/committee";

interface ActivityTabProps {
  workspaces: CommitteeWorkspace[];
}

export function ActivityTab({ workspaces }: ActivityTabProps) {
  return (
    <TabsContent value="activity" className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Recent Activity</h3>
        <div className="space-y-3">
          {workspaces
            .flatMap((workspace) =>
              workspace.activity.slice(0, 2).map((activity) => ({
                ...activity,
                workspaceName: workspace.name,
              })),
            )
            .slice(0, 10)
            .map((activity, index) => (
              <div
                key={`${activity.workspaceName}-${activity.id}-${index}`}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                    <Activity className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{activity.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {activity.workspaceName} • {activity.type.replace("_", " ")}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">
                    {activity.createdAt.toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
        </div>
      </div>
    </TabsContent>
  );
}
