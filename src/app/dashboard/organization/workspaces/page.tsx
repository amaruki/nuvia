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

import { AddWorkspaceForm } from "@/components/workspaces/add-workspace-form";
import { WorkspacesOverviewCards } from "@/components/workspaces/workspaces-overview-cards";
import { useHeader } from "@/contexts/dashboard-context";
import { useWorkspaces } from "@/lib/hooks/use-workspaces";
import { logger } from "@/lib/logger";
import type { CommitteeWorkspace, WorkspaceFormData } from "@/types/committee";

import { WorkspacesActionBar } from "./_components/workspaces-action-bar";
import { WorkspacesError, WorkspacesLoading } from "./_components/workspaces-states";
import { WorkspacesTabs } from "./_components/workspaces-tabs";

export default function OrganizationWorkspaces() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<CommitteeWorkspace | null>(null);
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

  const handleEdit = (workspace: CommitteeWorkspace) => {
    setEditingWorkspace(workspace);
    setShowAddForm(true);
  };

  const handleAdd = () => {
    setEditingWorkspace(null);
    setShowAddForm(true);
  };

  const handleFormSubmit = async (data: WorkspaceFormData) => {
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
        onAdd={handleAdd}
      />

      {/* Main Content Tabs */}
      <WorkspacesTabs
        workspaces={workspaces}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onViewDetails={(workspace) =>
          router.push(`/dashboard/organization/workspaces/${workspace.id}`)
        }
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleStatus={handleToggleStatus}
      />

      {/* Modals */}
      <AddWorkspaceForm
        open={showAddForm}
        onOpenChange={setShowAddForm}
        onSubmit={handleFormSubmit}
        initialData={editingWorkspace || undefined}
        isEditing={!!editingWorkspace}
      />

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
