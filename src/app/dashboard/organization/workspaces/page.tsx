"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  RefreshCw,
  AlertTriangle,
  Download,
  Plus,
  FolderOpen,
  Settings,
  Filter,
  Users,
  Calendar,
  Target,
  TrendingUp,
  FileText,
  MessageSquare,
  CheckSquare,
  Activity,
} from "lucide-react";

import { WorkspacesOverviewCards } from "@/components/workspaces/workspaces-overview-cards";
import { WorkspacesTable } from "@/components/workspaces/workspaces-table";
import { WorkspacesFilters } from "@/components/workspaces/workspaces-filters";
import { AddWorkspaceForm } from "@/components/workspaces/add-workspace-form";
import { useWorkspaces } from "@/lib/hooks/use-workspaces";
import { logger } from "@/lib/logger";
import { useHeader } from "@/contexts/dashboard-context";
import { CommitteeWorkspace } from "@/types/committee.types";
import { useRouter } from "next/navigation";

export default function OrganizationWorkspaces() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [showFilters, setShowFilters] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<CommitteeWorkspace | null>(null);
  const { setHeader, clearHeader } = useHeader();

  const {
    workspaces,
    statistics,
    loading,
    error,
    filters,
    updateFilters,
    clearFilters,
    refreshData,
    addWorkspace,
    updateWorkspace,
    deleteWorkspace,
    toggleWorkspaceStatus,
  } = useWorkspaces();

  useEffect(() => {
    setHeader({
      title: "Committee Workspaces",
      description:
        "Manage collaborative workspaces for document sharing, task management, discussions, and meetings",
    });

    return () => {
      clearHeader();
    };
  }, [setHeader, clearHeader]);

  const handleViewDetails = (workspace: CommitteeWorkspace) => {
    router.push(`/dashboard/organization/workspaces/${workspace.id}`);
  };

  const handleEdit = (workspace: CommitteeWorkspace) => {
    setEditingWorkspace(workspace);
    setShowAddForm(true);
  };

  const handleAdd = () => {
    setEditingWorkspace(null);
    setShowAddForm(true);
  };

  const handleFormSubmit = async (data: any) => {
    try {
      if (editingWorkspace) {
        await updateWorkspace(editingWorkspace.id, data);
      } else {
        await addWorkspace(data);
      }
      setShowAddForm(false);
      setEditingWorkspace(null);
    } catch (error) {
      logger.error("Error saving workspace", error);
    }
  };

  const handleDelete = async (workspace: CommitteeWorkspace) => {
    if (
      confirm(`Are you sure you want to delete "${workspace.name}"? This action cannot be undone.`)
    ) {
      try {
        await deleteWorkspace(workspace.id);
      } catch (error) {
        logger.error("Error deleting workspace", error);
      }
    }
  };

  const handleToggleStatus = async (
    workspace: CommitteeWorkspace,
    status: "active" | "archived",
  ) => {
    try {
      await toggleWorkspaceStatus(workspace.id, status);
    } catch (error) {
      logger.error("Error toggling workspace status", error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-muted rounded w-20 mb-2"></div>
              <div className="h-8 bg-muted rounded w-32 mb-2"></div>
              <div className="h-3 bg-muted rounded w-24"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button onClick={refreshData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>

        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Overview */}
      {statistics && <WorkspacesOverviewCards statistics={statistics} />}

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
          <Badge variant="outline" className="text-sm">
            {workspaces.length} workspaces total
          </Badge>
          {statistics && (
            <Badge variant="secondary" className="text-sm">
              {statistics.activeWorkspaces} active
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex-1 sm:flex-none"
          >
            <Filter className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
          </Button>
          <Button variant="outline" size="sm" onClick={refreshData} className="flex-1 sm:flex-none">
            <RefreshCw className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button size="sm" className="flex-1 sm:flex-none" onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Add Workspace</span>
            <span className="sm:hidden">Add</span>
          </Button>
          <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
            <Download className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <WorkspacesFilters
          filters={filters}
          onFiltersChange={updateFilters}
          onClearFilters={clearFilters}
        />
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
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
                          {workspace.members.length} members • {workspace.documents.length}{" "}
                          documents
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

        <TabsContent value="workspaces" className="space-y-6">
          <WorkspacesTable
            workspaces={workspaces}
            onViewDetails={handleViewDetails}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleStatus={handleToggleStatus}
          />
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Document Management Overview</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {workspaces.map((workspace) => (
                <div key={workspace.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">{workspace.name}</h4>
                    <Badge variant="outline">{workspace.documents.length} docs</Badge>
                  </div>
                  <div className="space-y-2">
                    {workspace.documents.slice(0, 3).map((doc) => (
                      <div key={doc.id} className="flex items-center gap-2 text-sm">
                        <FileText className="h-4 w-4 text-blue-500" />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{doc.name}</p>
                          <p className="text-muted-foreground truncate">{doc.fileName}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {doc.status}
                        </Badge>
                      </div>
                    ))}
                    {workspace.documents.length > 3 && (
                      <p className="text-xs text-muted-foreground">
                        +{workspace.documents.length - 3} more documents
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

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
      </Tabs>

      {/* Modals */}
      <AddWorkspaceForm
        open={showAddForm}
        onOpenChange={setShowAddForm}
        onSubmit={handleFormSubmit}
        initialData={editingWorkspace || undefined}
        isEditing={!!editingWorkspace}
      />
    </div>
  );
}
