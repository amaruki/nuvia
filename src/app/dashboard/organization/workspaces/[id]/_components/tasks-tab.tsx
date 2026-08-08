import { formatDistanceToNow } from "date-fns";
import { CheckSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { CommitteeWorkspace } from "@/types/committee";
import { getTaskPriorityBadge, getTaskStatusBadge } from "./status-badges";

interface TasksTabProps {
  workspace: CommitteeWorkspace;
}

export function TasksTab({ workspace }: TasksTabProps) {
  return (
    <TabsContent value="tasks" className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Workspace Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {workspace.tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                    <CheckSquare className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{task.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {task.assignedTo.length} assigned • {task.comments.length} comments
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Created {formatDistanceToNow(task.createdAt, { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    {getTaskStatusBadge(task.status)}
                    {getTaskPriorityBadge(task.priority)}
                  </div>
                </div>
              </div>
            ))}
            {workspace.tasks.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <CheckSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No tasks in this workspace yet</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
