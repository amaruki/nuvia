import { CheckSquare } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { TabsContent } from "@/components/ui/tabs";
import type { CommitteeWorkspace } from "@/types/committee";

interface TasksTabProps {
  workspaces: CommitteeWorkspace[];
}

export function TasksTab({ workspaces }: TasksTabProps) {
  return (
    <TabsContent value="tasks" className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Task Management Overview</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {workspaces.map((workspace) => (
            <div key={workspace.id} className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">{workspace.name}</h4>
                <Badge variant="outline">{workspace.tasks.length} tasks</Badge>
              </div>
              <div className="space-y-2">
                {workspace.tasks.slice(0, 3).map((task) => (
                  <div key={task.id} className="flex items-center gap-2 text-sm">
                    <CheckSquare className="h-4 w-4 text-green-500" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{task.title}</p>
                      <p className="text-muted-foreground truncate">{task.status}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {task.priority}
                    </Badge>
                  </div>
                ))}
                {workspace.tasks.length > 3 && (
                  <p className="text-xs text-muted-foreground">
                    +{workspace.tasks.length - 3} more tasks
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </TabsContent>
  );
}
