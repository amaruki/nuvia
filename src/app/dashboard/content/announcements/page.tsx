"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  RefreshCw,
  AlertTriangle,
  Download,
  Plus,
  Megaphone,
  Settings,
  Filter,
  Eye,
  BarChart3,
  Archive,
  Calendar,
  Bell,
  Zap,
  Pin,
  Target,
  Users,
  Mail,
  Smartphone,
  Home,
  Layout,
} from "lucide-react";

import { AnnouncementsOverviewCards } from "@/components/content/announcements-overview-cards";
import { AnnouncementsTable } from "@/components/content/announcements-table";
import { AnnouncementsFilters } from "@/components/content/announcements-filters";
import { AddAnnouncementForm } from "@/components/content/add-announcement-form";
import { useAnnouncements } from "@/lib/hooks/use-announcements";
import { logger } from "@/lib/logger";
import { useHeader } from "@/contexts/dashboard-context";
import { Announcement, AnnouncementFormData } from "@/types/announcement.types";
import { ArticleStatus } from "@/types/article.types";

export default function ContentAnnouncements() {
  const [activeTab, setActiveTab] = useState("overview");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedAnnouncements, setSelectedAnnouncements] = useState<string[]>([]);
  const [viewingAnnouncement, setViewingAnnouncement] = useState<Announcement | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const router = useRouter();
  const { setHeader, clearHeader } = useHeader();

  const {
    announcements,
    statistics,
    loading,
    error,
    filters,
    updateFilters,
    clearFilters,
    refreshData,
    addAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    duplicateAnnouncement,
    publishAnnouncement,
    archiveAnnouncement,
    scheduleAnnouncement,
    bulkPublish,
    bulkArchive,
    bulkDelete,
    exportAnnouncements,
    importAnnouncements,
    currentPage,
    totalPages,
    totalItems,
  } = useAnnouncements();

  useEffect(() => {
    setHeader({
      title: "Announcements Management",
      description:
        "Manage announcements, notifications, and important updates with comprehensive targeting",
    });

    return () => {
      clearHeader();
    };
  }, [setHeader, clearHeader]);

  const handleViewDetails = (announcement: Announcement) => {
    router.push(`/dashboard/content/announcements/${announcement.id}`);
  };

  const handleEdit = (announcement: Announcement) => {
    router.push(`/dashboard/content/announcements/edit/${announcement.id}`);
  };

  const handleAdd = () => {
    setShowAddForm(true);
  };

  const handleDelete = async (announcement: Announcement) => {
    if (
      confirm(
        `Are you sure you want to delete "${announcement.title}"? This action cannot be undone.`,
      )
    ) {
      try {
        await deleteAnnouncement(announcement.id);
      } catch (error) {
        logger.error("Error deleting announcement", error);
      }
    }
  };

  const handleStatusChange = async (announcement: Announcement, status: ArticleStatus) => {
    try {
      await updateAnnouncement(announcement.id, { status });
    } catch (error) {
      logger.error("Error changing announcement status", error);
    }
  };

  const handlePublish = async (announcement: Announcement) => {
    try {
      await publishAnnouncement(announcement.id);
    } catch (error) {
      logger.error("Error publishing announcement", error);
    }
  };

  const handleArchive = async (announcement: Announcement) => {
    try {
      await archiveAnnouncement(announcement.id);
    } catch (error) {
      logger.error("Error archiving announcement", error);
    }
  };

  const handleSchedule = async (announcement: Announcement, date: Date) => {
    try {
      await scheduleAnnouncement(announcement.id, date);
    } catch (error) {
      logger.error("Error scheduling announcement", error);
    }
  };

  const handleDuplicate = async (announcement: Announcement) => {
    try {
      await duplicateAnnouncement(announcement.id);
    } catch (error) {
      logger.error("Error duplicating announcement", error);
    }
  };

  const handleBulkPublish = async () => {
    if (selectedAnnouncements.length === 0) return;

    if (
      confirm(
        `Are you sure you want to publish ${selectedAnnouncements.length} selected announcements?`,
      )
    ) {
      try {
        await bulkPublish(selectedAnnouncements);
        setSelectedAnnouncements([]);
      } catch (error) {
        logger.error("Error bulk publishing", error);
      }
    }
  };

  const handleBulkArchive = async () => {
    if (selectedAnnouncements.length === 0) return;

    if (
      confirm(
        `Are you sure you want to archive ${selectedAnnouncements.length} selected announcements?`,
      )
    ) {
      try {
        await bulkArchive(selectedAnnouncements);
        setSelectedAnnouncements([]);
      } catch (error) {
        logger.error("Error bulk archiving", error);
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedAnnouncements.length === 0) return;

    if (
      confirm(
        `Are you sure you want to delete ${selectedAnnouncements.length} selected announcements? This action cannot be undone.`,
      )
    ) {
      try {
        await bulkDelete(selectedAnnouncements);
        setSelectedAnnouncements([]);
      } catch (error) {
        logger.error("Error bulk deleting", error);
      }
    }
  };

  const handleExport = (format: "csv" | "json" | "pdf") => {
    exportAnnouncements(format);
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        await importAnnouncements(file);
      } catch (error) {
        logger.error("Error importing announcements", error);
      }
    }
  };

  const handleAddAnnouncement = async (data: AnnouncementFormData) => {
    try {
      await addAnnouncement(data);
      setShowAddForm(false);
    } catch (error) {
      logger.error("Error adding announcement", error);
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US").format(num);
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

  if (showAddForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Create New Announcement</h2>
          <Button variant="outline" onClick={() => setShowAddForm(false)}>
            Cancel
          </Button>
        </div>
        <AddAnnouncementForm
          onSubmit={handleAddAnnouncement}
          onCancel={() => setShowAddForm(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
          <Badge variant="outline" className="text-sm">
            {totalItems} announcements total
          </Badge>
          {statistics && (
            <Badge variant="secondary" className="text-sm">
              {statistics.activeAnnouncements} published
            </Badge>
          )}
          {selectedAnnouncements.length > 0 && (
            <Badge variant="default" className="text-sm">
              {selectedAnnouncements.length} selected
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
            <span className="hidden sm:inline">Add Announcement</span>
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
        <AnnouncementsFilters
          filters={filters}
          onFiltersChange={updateFilters}
          onReset={clearFilters}
        />
      )}

      {/* Bulk Actions */}
      {selectedAnnouncements.length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg border">
          <span className="text-sm font-medium">Bulk Actions:</span>
          <Button variant="outline" size="sm" onClick={handleBulkPublish}>
            <Megaphone className="mr-2 h-4 w-4" />
            Publish ({selectedAnnouncements.length})
          </Button>
          <Button variant="outline" size="sm" onClick={handleBulkArchive}>
            <Archive className="mr-2 h-4 w-4" />
            Archive ({selectedAnnouncements.length})
          </Button>
          <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
            <AlertTriangle className="mr-2 h-4 w-4" />
            Delete ({selectedAnnouncements.length})
          </Button>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
          <TabsTrigger value="overview" className="text-xs sm:text-sm py-2 px-2">
            Overview
          </TabsTrigger>
          <TabsTrigger value="announcements" className="text-xs sm:text-sm py-2 px-2">
            Announcements
          </TabsTrigger>
          <TabsTrigger value="drafts" className="text-xs sm:text-sm py-2 px-2">
            Drafts
          </TabsTrigger>
          <TabsTrigger value="acknowledgments" className="text-xs sm:text-sm py-2 px-2">
            Acknowledgments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Quick Stats */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-50">
                      <Eye className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium">Total Acknowledgments</span>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">
                      {formatNumber(statistics?.totalAcknowledgments || 0)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-50">
                      <BarChart3 className="h-4 w-4 text-green-600" />
                    </div>
                    <span className="text-sm font-medium">Acknowledgment Rate</span>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">
                      {statistics?.averageAcknowledgmentRate.toFixed(1) || 0}%
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-50">
                      <Zap className="h-4 w-4 text-red-600" />
                    </div>
                    <span className="text-sm font-medium">Urgent</span>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{statistics?.urgentAnnouncements || 0}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-50">
                      <Pin className="h-4 w-4 text-purple-600" />
                    </div>
                    <span className="text-sm font-medium">Pinned</span>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{statistics?.pinnedAnnouncements || 0}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Monthly Trends */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Announcement Summary</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="min-w-0 flex-1 mr-2">
                  <p className="font-medium">Total Announcements</p>
                  <p className="text-xs text-muted-foreground">All announcements in the system</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-bold">
                    {formatNumber(statistics?.totalAnnouncements || 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">total</p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="announcements" className="space-y-6">
          <AnnouncementsTable
            announcements={announcements.slice(0, 10)} // Show first 10 for now
            onView={handleViewDetails}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
            onStatusChange={handleStatusChange}
          />
        </TabsContent>

        <TabsContent value="drafts" className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Draft Announcements</h3>
            <div className="space-y-3">
              {announcements
                .filter((a) => a.status === "draft")
                .slice(0, 10)
                .map((announcement) => (
                  <div
                    key={announcement.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="min-w-0 flex-1 mr-2">
                      <p className="font-medium">{announcement.title}</p>
                      <p className="text-xs text-muted-foreground">
                        Last modified: {announcement.lastModified.toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(announcement)}>
                        <Settings className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      <Button size="sm" onClick={() => handlePublish(announcement)}>
                        <Megaphone className="mr-2 h-4 w-4" />
                        Publish
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
            {announcements.filter((a) => a.status === "draft").length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Megaphone className="h-12 w-12 mx-auto mb-4 opacity-40" />
                <h3 className="text-lg font-medium mb-2">No draft announcements</h3>
                <p className="text-sm">
                  All your announcements are published. Create a new draft to get started.
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="acknowledgments" className="space-y-6">
          <div className="text-center py-8 text-muted-foreground">
            <Megaphone className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No acknowledgment analytics to display</p>
            <p className="text-sm mt-2">
              Acknowledgment statistics will appear here once announcements are created
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Import/Export Section */}
      <div className="flex items-center gap-2 p-3 bg-muted/20 rounded-lg border">
        <span className="text-sm font-medium">Import/Export:</span>
        <div className="flex gap-2">
          <input
            type="file"
            accept=".json,.csv"
            onChange={handleImport}
            className="hidden"
            id="import-announcements"
          />
          <Button variant="outline" size="sm" asChild>
            <label htmlFor="import-announcements" className="cursor-pointer">
              <Download className="mr-2 h-4 w-4" />
              Import
            </label>
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport("csv")}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport("json")}>
            <Download className="mr-2 h-4 w-4" />
            Export JSON
          </Button>
        </div>
      </div>
    </div>
  );
}
