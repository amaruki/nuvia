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
  FileText,
  Settings,
  Filter,
  Eye,
  BarChart3,
  Archive,
  Calendar,
} from "lucide-react";

import { PublicationsOverviewCards } from "@/components/content/publications-overview-cards";
import { PublicationsTable } from "@/components/content/publications-table";
import { PublicationsFilters } from "@/components/content/publications-filters";
import PublicationPageForm from "@/components/content/add-publication-form";
import { usePublications } from "@/lib/hooks/use-publications";
import { logger } from "@/lib/logger";
import { useHeader } from "@/contexts/dashboard-context";
import { Publication } from "@/types/publication.types";

export default function ContentPublications() {
  const [activeTab, setActiveTab] = useState("overview");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPublications, setSelectedPublications] = useState<string[]>([]);
  const [viewingPublication, setViewingPublication] = useState<Publication | null>(null);
  const router = useRouter();
  const { setHeader, clearHeader } = useHeader();

  const {
    publications,
    statistics,
    loading,
    error,
    filters,
    updateFilters,
    clearFilters,
    refreshData,
    addPublication,
    updatePublication,
    deletePublication,
    duplicatePublication,
    publishPublication,
    archivePublication,
    schedulePublication,
    bulkPublish,
    bulkArchive,
    bulkDelete,
    exportPublications,
    importPublications,
    currentPage,
    totalPages,
    totalItems,
  } = usePublications();

  useEffect(() => {
    setHeader({
      title: "Publications Management",
      description:
        "Manage articles, blogs, newsletters, and all content publications with comprehensive analytics and workflow controls",
    });

    return () => {
      clearHeader();
    };
  }, [setHeader, clearHeader]);

  const handleViewDetails = (publication: Publication) => {
    router.push(`/dashboard/content/publications/${publication.id}`);
  };

  const handleEdit = (publication: Publication) => {
    router.push(`/dashboard/content/publications/edit/${publication.id}`);
  };

  const handleAdd = () => {
    router.push(`/dashboard/content/publications/create`);
  };

  const handleDelete = async (publication: Publication) => {
    if (
      confirm(
        `Are you sure you want to delete "${publication.title}"? This action cannot be undone.`,
      )
    ) {
      try {
        await deletePublication(publication.id);
      } catch (error) {
        logger.error("Error deleting publication", error);
      }
    }
  };

  const handlePublish = async (publication: Publication) => {
    try {
      await publishPublication(publication.id);
    } catch (error) {
      logger.error("Error publishing publication", error);
    }
  };

  const handleArchive = async (publication: Publication) => {
    try {
      await archivePublication(publication.id);
    } catch (error) {
      logger.error("Error archiving publication", error);
    }
  };

  const handleSchedule = async (publication: Publication, date: Date) => {
    try {
      await schedulePublication(publication.id, date);
    } catch (error) {
      logger.error("Error scheduling publication", error);
    }
  };

  const handleDuplicate = async (publication: Publication) => {
    try {
      await duplicatePublication(publication.id);
    } catch (error) {
      logger.error("Error duplicating publication", error);
    }
  };

  const handleBulkPublish = async () => {
    if (selectedPublications.length === 0) return;

    if (
      confirm(
        `Are you sure you want to publish ${selectedPublications.length} selected publications?`,
      )
    ) {
      try {
        await bulkPublish(selectedPublications);
        setSelectedPublications([]);
      } catch (error) {
        logger.error("Error bulk publishing", error);
      }
    }
  };

  const handleBulkArchive = async () => {
    if (selectedPublications.length === 0) return;

    if (
      confirm(
        `Are you sure you want to archive ${selectedPublications.length} selected publications?`,
      )
    ) {
      try {
        await bulkArchive(selectedPublications);
        setSelectedPublications([]);
      } catch (error) {
        logger.error("Error bulk archiving", error);
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedPublications.length === 0) return;

    if (
      confirm(
        `Are you sure you want to delete ${selectedPublications.length} selected publications? This action cannot be undone.`,
      )
    ) {
      try {
        await bulkDelete(selectedPublications);
        setSelectedPublications([]);
      } catch (error) {
        logger.error("Error bulk deleting", error);
      }
    }
  };

  const handleExport = (format: "csv" | "json" | "pdf") => {
    exportPublications(format);
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        await importPublications(file);
      } catch (error) {
        logger.error("Error importing publications", error);
      }
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

  return (
    <div className="space-y-6">
      {/* Statistics Overview */}
      {statistics && <PublicationsOverviewCards statistics={statistics} />}

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
          <Badge variant="outline" className="text-sm">
            {totalItems} publications total
          </Badge>
          {statistics && (
            <Badge variant="secondary" className="text-sm">
              {statistics.publishedPublications} published
            </Badge>
          )}
          {selectedPublications.length > 0 && (
            <Badge variant="default" className="text-sm">
              {selectedPublications.length} selected
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
            <span className="hidden sm:inline">Add Publication</span>
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
        <PublicationsFilters
          filters={filters}
          onFiltersChange={updateFilters}
          onClearFilters={clearFilters}
        />
      )}

      {/* Bulk Actions */}
      {selectedPublications.length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg border">
          <span className="text-sm font-medium">Bulk Actions:</span>
          <Button variant="outline" size="sm" onClick={handleBulkPublish}>
            <FileText className="mr-2 h-4 w-4" />
            Publish ({selectedPublications.length})
          </Button>
          <Button variant="outline" size="sm" onClick={handleBulkArchive}>
            <Archive className="mr-2 h-4 w-4" />
            Archive ({selectedPublications.length})
          </Button>
          <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
            <AlertTriangle className="mr-2 h-4 w-4" />
            Delete ({selectedPublications.length})
          </Button>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
          <TabsTrigger value="overview" className="text-xs sm:text-sm py-2 px-2">
            Overview
          </TabsTrigger>
          <TabsTrigger value="publications" className="text-xs sm:text-sm py-2 px-2">
            Publications
          </TabsTrigger>
          <TabsTrigger value="drafts" className="text-xs sm:text-sm py-2 px-2">
            Drafts
          </TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs sm:text-sm py-2 px-2">
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Recent Activity */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Recent Activity</h3>
              <div className="space-y-3">
                {statistics?.recentActivity.slice(0, 5).map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="min-w-0 flex-1 mr-2">
                      <div>
                        <p className="text-sm font-medium">{activity.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {activity.action} by {activity.author}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-muted-foreground">
                        {activity.timestamp.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-50">
                      <Eye className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium">Total Views</span>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{formatNumber(statistics?.totalViews || 0)}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-50">
                      <BarChart3 className="h-4 w-4 text-green-600" />
                    </div>
                    <span className="text-sm font-medium">Avg Engagement</span>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">
                      {statistics?.averageEngagementScore.toFixed(1) || 0}%
                    </p>
                  </div>
                </div>
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
                      <p className="text-xs text-muted-foreground">
                        {trend.publicationsCreated} created, {trend.publicationsPublished} published
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold">{formatNumber(trend.totalViews)}</p>
                      <p className="text-xs text-muted-foreground">views</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="publications" className="space-y-6">
          <PublicationsTable
            publications={publications}
            onViewDetails={handleViewDetails}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
            onPublish={handlePublish}
            onArchive={handleArchive}
            onSchedule={handleSchedule}
            selectedPublications={selectedPublications}
            onSelectionChange={setSelectedPublications}
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateFilters({ page: Math.max(1, currentPage - 1) })}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateFilters({ page: Math.min(totalPages, currentPage + 1) })}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="drafts" className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Draft Publications</h3>
            <div className="space-y-3">
              {publications
                .filter((p) => p.status === "draft")
                .map((publication) => (
                  <div
                    key={publication.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="min-w-0 flex-1 mr-2">
                      <p className="font-medium">{publication.title}</p>
                      <p className="text-xs text-muted-foreground">
                        Last modified: {publication.lastModified.toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(publication)}>
                        <Settings className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      <Button size="sm" onClick={() => handlePublish(publication)}>
                        <FileText className="mr-2 h-4 w-4" />
                        Publish
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
            {publications.filter((p) => p.status === "draft").length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-40" />
                <h3 className="text-lg font-medium mb-2">No draft publications</h3>
                <p className="text-sm">
                  All your publications are published. Create a new draft to get started.
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Performance by Type */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Performance by Type</h3>
              <div className="space-y-3">
                {statistics?.publicationsByType.map((type) => (
                  <div
                    key={type.type}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="min-w-0 flex-1 mr-2">
                      <p className="font-medium">{type.type.replace("_", " ")}</p>
                      <p className="text-xs text-muted-foreground">{type.count} publications</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold">{formatNumber(type.views)}</p>
                      <p className="text-xs text-muted-foreground">
                        {type.engagement.toFixed(1)}% engagement
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Performance by Category */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Performance by Category</h3>
              <div className="space-y-3">
                {statistics?.publicationsByCategory.map((category) => (
                  <div
                    key={category.category}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="min-w-0 flex-1 mr-2">
                      <p className="font-medium">{category.category.replace("_", " ")}</p>
                      <p className="text-xs text-muted-foreground">{category.count} publications</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold">{formatNumber(category.views)}</p>
                      <p className="text-xs text-muted-foreground">
                        {category.engagement.toFixed(1)}% engagement
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
            id="import-publications"
          />
          <Button variant="outline" size="sm" asChild>
            <label htmlFor="import-publications" className="cursor-pointer">
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
