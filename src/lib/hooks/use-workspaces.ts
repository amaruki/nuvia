"use client";

import { useState, useEffect, useMemo } from "react";
import {
  CommitteeWorkspace,
  WorkspaceOverallStatistics,
  WorkspaceFilterOptions,
} from "@/types/committee.types";
import { mockWorkspaces, mockWorkspaceStatistics } from "@/lib/data/mock-workspace-data";
import { logger } from "@/lib/logger";

export function useWorkspaces() {
  const [workspaces, setWorkspaces] = useState<CommitteeWorkspace[]>([]);
  const [statistics, setStatistics] = useState<WorkspaceOverallStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<WorkspaceFilterOptions>({});

  // Simulate API call to fetch workspaces
  const fetchWorkspaces = async () => {
    setLoading(true);
    setError(null);

    try {
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Apply filters
      let filteredWorkspaces = [...mockWorkspaces];

      if (filters.status && filters.status.length > 0) {
        filteredWorkspaces = filteredWorkspaces.filter((workspace) =>
          filters.status!.includes(workspace.status),
        );
      }

      if (filters.type && filters.type.length > 0) {
        filteredWorkspaces = filteredWorkspaces.filter((workspace) =>
          filters.type!.includes(workspace.type),
        );
      }

      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredWorkspaces = filteredWorkspaces.filter(
          (workspace) =>
            workspace.name.toLowerCase().includes(searchTerm) ||
            workspace.description?.toLowerCase().includes(searchTerm),
        );
      }

      if (filters.memberRole && filters.memberRole.length > 0) {
        filteredWorkspaces = filteredWorkspaces.filter((workspace) =>
          workspace.members.some((member) => filters.memberRole!.includes(member.role)),
        );
      }

      if (filters.dateRange) {
        filteredWorkspaces = filteredWorkspaces.filter((workspace) => {
          const workspaceDate = workspace.createdAt;
          return (
            workspaceDate >= filters.dateRange!.start && workspaceDate <= filters.dateRange!.end
          );
        });
      }

      setWorkspaces(filteredWorkspaces);
      setStatistics(mockWorkspaceStatistics);
    } catch (err) {
      setError("Failed to fetch workspaces. Please try again.");
      logger.error("Error fetching workspaces", err);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchWorkspaces();
  }, []);

  // Refetch when filters change
  useEffect(() => {
    fetchWorkspaces();
  }, [filters]);

  const updateFilters = (newFilters: Partial<WorkspaceFilterOptions>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  const refreshData = () => {
    fetchWorkspaces();
  };

  const addWorkspace = async (
    workspaceData: Omit<CommitteeWorkspace, "id" | "createdAt" | "updatedAt" | "createdBy">,
  ) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      const newWorkspace: CommitteeWorkspace = {
        ...workspaceData,
        id: `ws_${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: "current-user", // TODO: Get from auth context
      };

      setWorkspaces((prev) => [...prev, newWorkspace]);
      return newWorkspace;
    } catch (err) {
      setError("Failed to add workspace. Please try again.");
      throw err;
    }
  };

  const updateWorkspace = async (id: string, updates: Partial<CommitteeWorkspace>) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      setWorkspaces((prev) =>
        prev.map((workspace) =>
          workspace.id === id
            ? { ...workspace, ...updates, updatedAt: new Date(), updatedBy: "current-user" }
            : workspace,
        ),
      );
    } catch (err) {
      setError("Failed to update workspace. Please try again.");
      throw err;
    }
  };

  const deleteWorkspace = async (id: string) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      setWorkspaces((prev) => prev.filter((workspace) => workspace.id !== id));
    } catch (err) {
      setError("Failed to delete workspace. Please try again.");
      throw err;
    }
  };

  const toggleWorkspaceStatus = async (id: string, status: "active" | "archived") => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 300));

      setWorkspaces((prev) =>
        prev.map((workspace) =>
          workspace.id === id
            ? { ...workspace, status, updatedAt: new Date(), updatedBy: "current-user" }
            : workspace,
        ),
      );
    } catch (err) {
      setError("Failed to update workspace status. Please try again.");
      throw err;
    }
  };

  // Computed values
  const activeWorkspaces = useMemo(
    () => workspaces.filter((workspace) => workspace.status === "active"),
    [workspaces],
  );

  const archivedWorkspaces = useMemo(
    () => workspaces.filter((workspace) => workspace.status === "archived"),
    [workspaces],
  );

  const lockedWorkspaces = useMemo(
    () => workspaces.filter((workspace) => workspace.status === "locked"),
    [workspaces],
  );

  return {
    // Data
    workspaces,
    statistics,
    loading,
    error,
    filters,

    // Computed
    activeWorkspaces,
    archivedWorkspaces,
    lockedWorkspaces,

    // Actions
    updateFilters,
    clearFilters,
    refreshData,
    addWorkspace,
    updateWorkspace,
    deleteWorkspace,
    toggleWorkspaceStatus,
  };
}
