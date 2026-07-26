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
  Briefcase,
  Settings,
  Filter,
  Users,
  Calendar,
  Target,
  TrendingUp,
} from "lucide-react";

import { CommitteesOverviewCards } from "@/components/committees/committees-overview-cards";
import { CommitteesTable } from "@/components/committees/committees-table";
import { CommitteesFilters } from "@/components/committees/committees-filters";
import { AddCommitteeForm } from "@/components/committees/add-committee-form";
import { useCommittees } from "@/lib/hooks/use-committees";
import { useHeader } from "@/contexts/dashboard-context";
import { Committee } from "@/types/committee.types";
import { useRouter } from "next/navigation";

export default function OrganizationCommittees() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [showFilters, setShowFilters] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCommittee, setEditingCommittee] = useState<Committee | null>(null);
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
      console.error("Error saving committee:", error);
    }
  };

  const handleDelete = async (committee: Committee) => {
    if (
      confirm(
        `Are you sure you want to delete "${committee.displayName}"? This action cannot be undone.`,
      )
    ) {
      try {
        await deleteCommittee(committee.id);
      } catch (error) {
        console.error("Error deleting committee:", error);
      }
    }
  };

  const handleToggleStatus = async (committee: Committee, status: "active" | "inactive") => {
    try {
      await toggleCommitteeStatus(committee.id, status);
    } catch (error) {
      console.error("Error toggling committee status:", error);
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
      {statistics && <CommitteesOverviewCards statistics={statistics} />}

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
          <Badge variant="outline" className="text-sm">
            {committees.length} committees total
          </Badge>
          {statistics && (
            <Badge variant="secondary" className="text-sm">
              {statistics.activeCommittees} active
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
            <span className="hidden sm:inline">Add Committee</span>
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

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Committee Status Summary */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Committee Status Summary</h3>
              <div className="space-y-3">
                {committees.map((committee) => (
                  <div
                    key={committee.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                        <Briefcase className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{committee.displayName}</p>
                        <p className="text-sm text-muted-foreground">
                          {committee.type.replace("_", " ")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={
                          committee.status === "active"
                            ? "default"
                            : committee.status === "inactive"
                              ? "secondary"
                              : committee.status === "pending"
                                ? "outline"
                                : "destructive"
                        }
                      >
                        {committee.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Performance Highlights</h3>
              <div className="space-y-3">
                {statistics?.topPerformingCommittees.slice(0, 3).map((committee) => (
                  <div
                    key={committee.committeeId}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                        <Target className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{committee.committeeName}</p>
                        <p className="text-sm text-muted-foreground">
                          {committee.type.replace("_", " ")} • {committee.memberCount} members
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{committee.impactScore.toFixed(1)}</p>
                      <p className="text-xs text-muted-foreground">impact score</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          {statistics && (
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Goal Completion</h3>
                <div className="space-y-3">
                  {statistics.topPerformingCommittees.slice(0, 3).map((committee) => (
                    <div
                      key={committee.committeeId}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="min-w-0 flex-1 mr-2">
                        <p className="font-medium">{committee.committeeName}</p>
                        <p className="text-sm text-muted-foreground">
                          {committee.memberCount} members • {committee.deliverablesCount}{" "}
                          deliverables
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p
                          className={`text-lg font-bold ${
                            committee.goalCompletionRate >= 80
                              ? "text-emerald-600"
                              : "text-amber-600"
                          }`}
                        >
                          {committee.goalCompletionRate.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Meeting Attendance</h3>
                <div className="space-y-3">
                  {statistics.topPerformingCommittees.slice(0, 3).map((committee) => (
                    <div
                      key={committee.committeeId}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="min-w-0 flex-1 mr-2">
                        <p className="font-medium">{committee.committeeName}</p>
                        <p className="text-sm text-muted-foreground">
                          {committee.type.replace("_", " ")} • {committee.memberCount} members
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-lg font-bold">
                          {committee.meetingAttendanceRate.toFixed(1)}%
                        </p>
                        <p className="text-xs text-muted-foreground">attendance rate</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="committees" className="space-y-6">
          <CommitteesTable
            committees={committees}
            onViewDetails={handleViewDetails}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleStatus={handleToggleStatus}
          />
        </TabsContent>

        <TabsContent value="leadership" className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Committee Leadership Overview</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {committees.map((committee) => (
                <div key={committee.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">{committee.displayName}</h4>
                    <Badge variant="outline">{committee.leadership.length} leaders</Badge>
                  </div>
                  <div className="space-y-2">
                    {committee.leadership.slice(0, 3).map((leader) => (
                      <div key={leader.id} className="flex items-center gap-2 text-sm">
                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-3 w-3 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{leader.name}</p>
                          <p className="text-muted-foreground truncate">{leader.title}</p>
                        </div>
                      </div>
                    ))}
                    {committee.leadership.length > 3 && (
                      <p className="text-xs text-muted-foreground">
                        +{committee.leadership.length - 3} more leaders
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Committee Performance */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Committee Performance</h3>
              <div className="space-y-3">
                {statistics?.topPerformingCommittees.map((committee) => (
                  <div
                    key={committee.committeeId}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="min-w-0 flex-1 mr-2">
                      <p className="font-medium">{committee.committeeName}</p>
                      <p className="text-sm text-muted-foreground">
                        {committee.memberCount} members • {committee.deliverablesCount} deliverables
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold">{committee.impactScore.toFixed(1)}</p>
                      <p className="text-xs text-muted-foreground">impact score</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Type Analytics */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Committee Types</h3>
              <div className="space-y-3">
                {statistics?.typeBreakdown.map((type) => (
                  <div
                    key={type.type}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="min-w-0 flex-1 mr-2">
                      <p className="font-medium capitalize">{type.type.replace("_", " ")}</p>
                      <p className="text-sm text-muted-foreground">
                        {type.committeeCount} committees
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold">{type.averageImpactScore.toFixed(1)}</p>
                      <p className="text-xs text-muted-foreground">avg impact score</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Monthly Trends */}
          {statistics?.monthlyTrend && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Monthly Trends</h3>
              <div className="space-y-3">
                {statistics.monthlyTrend.slice(0, 6).map((trend, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="min-w-0 flex-1 mr-2">
                      <p className="font-medium">{trend.month}</p>
                      <p className="text-sm text-muted-foreground">
                        {trend.meetingCount} meetings • {trend.memberCount} members
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold">{trend.goalsCompleted}</p>
                      <p className="text-xs text-muted-foreground">goals completed</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <AddCommitteeForm
        open={showAddForm}
        onOpenChange={setShowAddForm}
        onSubmit={handleFormSubmit}
        initialData={editingCommittee || undefined}
        isEditing={!!editingCommittee}
      />
    </div>
  );
}
