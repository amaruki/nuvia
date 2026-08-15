"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

import { useFormSheet } from "@/components/dashboard/form-sheet";
import { WorkspacesOverviewCards } from "@/components/workspaces/workspaces-overview-cards";
import { useHeader } from "@/contexts/dashboard-context";
import { useWorkspaces } from "@/lib/hooks/use-workspaces";
import { logger } from "@/lib/logger";
import type { CommitteeWorkspace } from "@/types/committee";

import { WorkspaceFormSheet } from "./_components/workspace-form";
import { WorkspacesActionBar } from "./_components/workspaces-action-bar";
import { WorkspacesError, WorkspacesLoading } from "./_components/workspaces-states";
import { WorkspacesTabs } from "./_components/workspaces-tabs";

export default function OrganizationWorkspaces() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const sheet = useFormSheet();
  const [workspaceToDelete, setWorkspaceToDelete] = useState<CommitteeWorkspace | null>(null);
  const [isDeletingWorkspace, setIsDeletingWorkspace] = useState(false);
  const { setHeader, clearHeader } = useHeader();

  const {
    workspaces,
    statistics,
    loading,
    error,
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

  const handleDelete = (workspace: CommitteeWorkspace) => {
    setWorkspaceToDelete(workspace);
  };

  const confirmDeleteWorkspace = async () => {
    if (!workspaceToDelete) return;
    try {
      setIsDeletingWorkspace(true);
      await deleteWorkspace(workspaceToDelete.id);
      setWorkspaceToDelete(null);
    } catch (error) {
      logger.error("Error deleting workspace", error);
    } finally {
      setIsDeletingWorkspace(false);
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
    return <WorkspacesLoading />;
  }

  if (error) {
    return <WorkspacesError error={error} onRetry={refreshData} />;
  }

  return (
    <div className="space-y-6">
      {/* Statistics Overview */}
      {statistics && <WorkspacesOverviewCards statistics={statistics} />}

      <WorkspacesActionBar
        totalWorkspaces={workspaces.length}
        statistics={statistics}
        onRefresh={refreshData}
        onAdd={() => sheet.openCreate()}
      />

      {/* Main Content Tabs */}
      <WorkspacesTabs
        workspaces={workspaces}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onViewDetails={(workspace) =>
          router.push(`/dashboard/organization/workspaces/${workspace.id}`)
        }
        onEdit={(workspace) => sheet.openEdit(workspace.id)}
        onDelete={handleDelete}
        onToggleStatus={handleToggleStatus}
      />

      <WorkspaceFormSheet sheet={sheet} onCreate={addWorkspace} onUpdate={updateWorkspace} />

      <AlertDialog
        open={workspaceToDelete !== null}
        onOpenChange={(open) => {
          if (!open && !isDeletingWorkspace) setWorkspaceToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{workspaceToDelete?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingWorkspace}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={isDeletingWorkspace || !workspaceToDelete}
              onClick={confirmDeleteWorkspace}
            >
              {isDeletingWorkspace ? "Deleting..." : "Delete workspace"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
