import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WorkspacesTable } from "@/components/workspaces/workspaces-table";
import type { CommitteeWorkspace } from "@/types/committee";

import { ActivityTab } from "./activity-tab";
import { DocumentsTab } from "./documents-tab";
import { OverviewTab } from "./overview-tab";
import { TasksTab } from "./tasks-tab";

interface WorkspacesTabsProps {
  workspaces: CommitteeWorkspace[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  onViewDetails: (workspace: CommitteeWorkspace) => void;
  onEdit: (workspace: CommitteeWorkspace) => void;
  onDelete: (workspace: CommitteeWorkspace) => void;
  onToggleStatus: (workspace: CommitteeWorkspace, status: "active" | "archived") => void;
}

export function WorkspacesTabs({
  workspaces,
  activeTab,
  onTabChange,
  onViewDetails,
  onEdit,
  onDelete,
  onToggleStatus,
}: WorkspacesTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="space-y-6">
      <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 h-auto">
        <TabsTrigger value="overview" className="text-xs sm:text-sm py-2 px-2">
          Overview
        </TabsTrigger>
        <TabsTrigger value="workspaces" className="text-xs sm:text-sm py-2 px-2">
          Workspaces
        </TabsTrigger>
        <TabsTrigger value="documents" className="text-xs sm:text-sm py-2 px-2">
          Documents
        </TabsTrigger>
        <TabsTrigger value="tasks" className="text-xs sm:text-sm py-2 px-2">
          Tasks
        </TabsTrigger>
        <TabsTrigger value="activity" className="text-xs sm:text-sm py-2 px-2">
          Activity
        </TabsTrigger>
      </TabsList>

      <OverviewTab workspaces={workspaces} />

      <TabsContent value="workspaces" className="space-y-6">
        <WorkspacesTable
          workspaces={workspaces}
          onViewDetails={onViewDetails}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleStatus={onToggleStatus}
        />
      </TabsContent>

      <DocumentsTab workspaces={workspaces} />

      <TasksTab workspaces={workspaces} />

      <ActivityTab workspaces={workspaces} />
    </Tabs>
  );
}
