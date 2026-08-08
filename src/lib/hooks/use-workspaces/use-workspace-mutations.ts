"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { apiFetch, ApiClientError } from "@/lib/api-client";

import { WORKSPACES_API_PATH } from "./constants";
import { toWorkspaceUi } from "./hydrate-workspace";
import type { WireWorkspace, WorkspaceCreateInput, WorkspaceUpdateChanges } from "./types";

export function useWorkspaceMutations() {
  const queryClient = useQueryClient();

  const invalidateWorkspaces = () => queryClient.invalidateQueries({ queryKey: ["workspaces"] });

  const createMutation = useMutation({
    mutationFn: async (input: WorkspaceCreateInput) => {
      const { data } = await apiFetch<WireWorkspace>(WORKSPACES_API_PATH, {
        method: "POST",
        body: JSON.stringify(input),
      });
      return toWorkspaceUi(data);
    },
    onSuccess: () => {
      toast.success("Workspace created");
      invalidateWorkspaces();
    },
    onError: (error) => {
      toast.error(error instanceof ApiClientError ? error.message : "Failed to create workspace");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: WorkspaceUpdateChanges }) => {
      const { data } = await apiFetch<WireWorkspace>(`${WORKSPACES_API_PATH}/${id}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });
      return toWorkspaceUi(data);
    },
    onSuccess: () => {
      toast.success("Workspace updated");
      invalidateWorkspaces();
    },
    onError: (error) => {
      toast.error(error instanceof ApiClientError ? error.message : "Failed to update workspace");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiFetch(`${WORKSPACES_API_PATH}/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      toast.success("Workspace deleted");
      invalidateWorkspaces();
    },
    onError: (error) => {
      toast.error(error instanceof ApiClientError ? error.message : "Failed to delete workspace");
    },
  });

  const addWorkspace = async (workspaceData: WorkspaceCreateInput) => {
    await createMutation.mutateAsync(workspaceData);
  };

  const updateWorkspace = async (id: string, updates: WorkspaceUpdateChanges) => {
    await updateMutation.mutateAsync({ id, updates });
  };

  const deleteWorkspace = async (id: string) => {
    await deleteMutation.mutateAsync(id);
  };

  const toggleWorkspaceStatus = async (id: string, status: "active" | "archived") => {
    await updateMutation.mutateAsync({ id, updates: { status } });
  };

  return {
    invalidateWorkspaces,
    addWorkspace,
    updateWorkspace,
    deleteWorkspace,
    toggleWorkspaceStatus,
  };
}
