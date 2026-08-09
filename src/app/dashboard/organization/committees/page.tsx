"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

import { CommitteesOverviewCards } from "@/components/committees/committees-overview-cards";
import { CommitteesFilters } from "@/components/committees/committees-filters";
import { AddCommitteeForm } from "@/components/committees/add-committee-form";
import { useCommittees } from "@/lib/hooks/use-committees";
import { logger } from "@/lib/logger";
import { useHeader } from "@/contexts/dashboard-context";
import { Committee } from "@/types/committee";
import { useRouter } from "next/navigation";

import { CommitteesActionBar } from "./_components/committees-action-bar";
import { CommitteesAnalyticsTab } from "./_components/committees-analytics-tab";
import { CommitteesLeadershipTab } from "./_components/committees-leadership-tab";
import { CommitteesListTab } from "./_components/committees-list-tab";
import { CommitteesOverviewTab } from "./_components/committees-overview-tab";
import { CommitteesError, CommitteesLoading } from "./_components/committees-states";

export default function OrganizationCommittees() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [showFilters, setShowFilters] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCommittee, setEditingCommittee] = useState<Committee | null>(null);
  const [committeeToDelete, setCommitteeToDelete] = useState<Committee | null>(null);
  const [isDeletingCommittee, setIsDeletingCommittee] = useState(false);
  const { setHeader, clearHeader } = useHeader();

  const {
    committees,
    statistics,
    loading,
    error,
    filters,
    updateFilters,
    clearFilters,
    refreshData,
    addCommittee,
    updateCommittee,
    deleteCommittee,
    toggleCommitteeStatus,
  } = useCommittees();

  useEffect(() => {
    setHeader({
      title: "Committees Management",
      description:
        "Manage functional and special interest groups, committee leadership, and performance metrics",
    });

    return () => {
      clearHeader();
    };
  }, [setHeader, clearHeader]);

  const handleViewDetails = (committee: Committee) => {
    router.push(`/dashboard/organization/committees/${committee.id}`);
  };

  const handleEdit = (committee: Committee) => {
    setEditingCommittee(committee);
    setShowAddForm(true);
  };

  const handleAdd = () => {
    setEditingCommittee(null);
    setShowAddForm(true);
  };

  const handleFormSubmit = async (data: any) => {
    try {
      if (editingCommittee) {
        await updateCommittee(editingCommittee.id, data);
      } else {
        await addCommittee(data);
      }
      setShowAddForm(false);
      setEditingCommittee(null);
    } catch (error) {
      logger.error("Error saving committee", error);
    }
  };

  const handleDelete = (committee: Committee) => {
    setCommitteeToDelete(committee);
  };

  const confirmDeleteCommittee = async () => {
    if (!committeeToDelete) return;
    try {
      setIsDeletingCommittee(true);
      await deleteCommittee(committeeToDelete.id);
      setCommitteeToDelete(null);
    } catch (error) {
      logger.error("Error deleting committee", error);
    } finally {
      setIsDeletingCommittee(false);
    }
  };

  const handleToggleStatus = async (committee: Committee, status: "active" | "inactive") => {
    try {
      await toggleCommitteeStatus(committee.id, status);
    } catch (error) {
      logger.error("Error toggling committee status", error);
    }
  };

  if (loading) {
    return <CommitteesLoading />;
  }

  if (error) {
    return <CommitteesError error={error} onRetry={refreshData} />;
  }

  return (
    <div className="space-y-6">
      {/* Statistics Overview */}
      {statistics && <CommitteesOverviewCards statistics={statistics} />}

      {/* Action Bar */}
      <CommitteesActionBar
        totalCount={committees.length}
        activeCount={statistics?.activeCommittees}
        onToggleFilters={() => setShowFilters(!showFilters)}
        onRefresh={refreshData}
        onAdd={handleAdd}
      />

      {/* Filters Panel */}
      {showFilters && (
        <CommitteesFilters
          filters={filters}
          onFiltersChange={updateFilters}
          onClearFilters={clearFilters}
        />
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
          <TabsTrigger value="overview" className="text-xs sm:text-sm py-2 px-2">
            Overview
          </TabsTrigger>
          <TabsTrigger value="committees" className="text-xs sm:text-sm py-2 px-2">
            Committees
          </TabsTrigger>
          <TabsTrigger value="leadership" className="text-xs sm:text-sm py-2 px-2">
            Leadership
          </TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs sm:text-sm py-2 px-2">
            Analytics
          </TabsTrigger>
        </TabsList>

        <CommitteesOverviewTab committees={committees} statistics={statistics} />
        <CommitteesListTab
          committees={committees}
          onViewDetails={handleViewDetails}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggleStatus={handleToggleStatus}
        />
        <CommitteesLeadershipTab committees={committees} />
        <CommitteesAnalyticsTab statistics={statistics} />
      </Tabs>

      {/* Modals */}
      <AddCommitteeForm
        open={showAddForm}
        onOpenChange={setShowAddForm}
        onSubmit={handleFormSubmit}
        initialData={editingCommittee || undefined}
        isEditing={!!editingCommittee}
      />

      <AlertDialog
        open={committeeToDelete !== null}
        onOpenChange={(open) => {
          if (!open && !isDeletingCommittee) setCommitteeToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{committeeToDelete?.displayName}"?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingCommittee}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={isDeletingCommittee || !committeeToDelete}
              onClick={confirmDeleteCommittee}
            >
              {isDeletingCommittee ? "Deleting..." : "Delete committee"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
