"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Committee,
  CommitteeOverallStatistics,
  CommitteeFilterOptions,
} from "@/types/committee.types";
import { mockCommittees, mockCommitteeStatistics } from "@/lib/data/mock-committee-data";

export function useCommittees() {
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [statistics, setStatistics] = useState<CommitteeOverallStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<CommitteeFilterOptions>({});

  // Simulate API call to fetch committees
  const fetchCommittees = async () => {
    setLoading(true);
    setError(null);

    try {
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Apply filters
      let filteredCommittees = [...mockCommittees];

      if (filters.status && filters.status.length > 0) {
        filteredCommittees = filteredCommittees.filter((committee) =>
          filters.status!.includes(committee.status),
        );
      }

      if (filters.type && filters.type.length > 0) {
        filteredCommittees = filteredCommittees.filter((committee) =>
          filters.type!.includes(committee.type),
        );
      }

      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredCommittees = filteredCommittees.filter(
          (committee) =>
            committee.displayName.toLowerCase().includes(searchTerm) ||
            committee.description?.toLowerCase().includes(searchTerm) ||
            committee.purpose.toLowerCase().includes(searchTerm),
        );
      }

      if (filters.memberCountRange) {
        filteredCommittees = filteredCommittees.filter((committee) => {
          const count = committee.metrics.memberCount;
          return count >= filters.memberCountRange!.min && count <= filters.memberCountRange!.max;
        });
      }

      setCommittees(filteredCommittees);
      setStatistics(mockCommitteeStatistics);
    } catch (err) {
      setError("Failed to fetch committees. Please try again.");
      console.error("Error fetching committees:", err);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchCommittees();
  }, []);

  // Refetch when filters change
  useEffect(() => {
    fetchCommittees();
  }, [filters]);

  const updateFilters = (newFilters: Partial<CommitteeFilterOptions>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  const refreshData = () => {
    fetchCommittees();
  };

  const addCommittee = async (
    committeeData: Omit<Committee, "id" | "createdAt" | "updatedAt" | "createdBy">,
  ) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      const newCommittee: Committee = {
        ...committeeData,
        id: `com_${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: "current-user", // TODO: Get from auth context
      };

      setCommittees((prev) => [...prev, newCommittee]);
      return newCommittee;
    } catch (err) {
      setError("Failed to add committee. Please try again.");
      throw err;
    }
  };

  const updateCommittee = async (id: string, updates: Partial<Committee>) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      setCommittees((prev) =>
        prev.map((committee) =>
          committee.id === id
            ? { ...committee, ...updates, updatedAt: new Date(), updatedBy: "current-user" }
            : committee,
        ),
      );
    } catch (err) {
      setError("Failed to update committee. Please try again.");
      throw err;
    }
  };

  const deleteCommittee = async (id: string) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      setCommittees((prev) => prev.filter((committee) => committee.id !== id));
    } catch (err) {
      setError("Failed to delete committee. Please try again.");
      throw err;
    }
  };

  const toggleCommitteeStatus = async (id: string, status: "active" | "inactive") => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 300));

      setCommittees((prev) =>
        prev.map((committee) =>
          committee.id === id
            ? { ...committee, status, updatedAt: new Date(), updatedBy: "current-user" }
            : committee,
        ),
      );
    } catch (err) {
      setError("Failed to update committee status. Please try again.");
      throw err;
    }
  };

  // Computed values
  const activeCommittees = useMemo(
    () => committees.filter((committee) => committee.status === "active"),
    [committees],
  );

  const inactiveCommittees = useMemo(
    () => committees.filter((committee) => committee.status === "inactive"),
    [committees],
  );

  const pendingCommittees = useMemo(
    () => committees.filter((committee) => committee.status === "pending"),
    [committees],
  );

  return {
    // Data
    committees,
    statistics,
    loading,
    error,
    filters,

    // Computed
    activeCommittees,
    inactiveCommittees,
    pendingCommittees,

    // Actions
    updateFilters,
    clearFilters,
    refreshData,
    addCommittee,
    updateCommittee,
    deleteCommittee,
    toggleCommitteeStatus,
  };
}
