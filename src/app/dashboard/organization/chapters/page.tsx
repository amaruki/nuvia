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
  Building2,
  Settings,
  Filter,
  MapPin,
  Users,
  Calendar,
  TrendingUp,
} from "lucide-react";

import { ChaptersOverviewCards } from "@/components/chapters/chapters-overview-cards";
import { ChaptersTable } from "@/components/chapters/chapters-table";
import { ChaptersFilters } from "@/components/chapters/chapters-filters";
import { AddChapterForm } from "@/components/chapters/add-chapter-form";
import { useChapters } from "@/lib/hooks/use-chapters";
import { useHeader } from "@/contexts/dashboard-context";
import { Chapter } from "@/types/chapter.types";
import { useRouter } from "next/navigation";

export default function OrganizationChapters() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [showFilters, setShowFilters] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const { setHeader, clearHeader } = useHeader();

  const {
    chapters,
    statistics,
    loading,
    error,
    filters,
    updateFilters,
    clearFilters,
    refreshData,
    addChapter,
    updateChapter,
    deleteChapter,
    toggleChapterStatus,
  } = useChapters();

  useEffect(() => {
    setHeader({
      title: "Chapters Management",
      description: "Manage geographic and regional organizational structure, chapter leadership, and performance metrics",
    });

    return () => {
      clearHeader();
    };
  }, [setHeader, clearHeader]);

  const handleViewDetails = (chapter: Chapter) => {
    router.push(`/dashboard/organization/chapters/${chapter.id}`);
  };

  const handleEdit = (chapter: Chapter) => {
    setEditingChapter(chapter);
    setShowAddForm(true);
  };

  const handleAdd = () => {
    setEditingChapter(null);
    setShowAddForm(true);
  };

  const handleFormSubmit = async (data: any) => {
    try {
      if (editingChapter) {
        await updateChapter(editingChapter.id, data);
      } else {
        await addChapter(data);
      }
      setShowAddForm(false);
      setEditingChapter(null);
    } catch (error) {
      console.error("Error saving chapter:", error);
    }
  };

  const handleDelete = async (chapter: Chapter) => {
    if (confirm(`Are you sure you want to delete "${chapter.displayName}"? This action cannot be undone.`)) {
      try {
        await deleteChapter(chapter.id);
      } catch (error) {
        console.error("Error deleting chapter:", error);
      }
    }
  };

  const handleToggleStatus = async (chapter: Chapter, status: "active" | "inactive") => {
    try {
      await toggleChapterStatus(chapter.id, status);
    } catch (error) {
      console.error("Error toggling chapter status:", error);
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
      {statistics && <ChaptersOverviewCards statistics={statistics} />}

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
          <Badge variant="outline" className="text-sm">
            {chapters.length} chapters total
          </Badge>
          {statistics && (
            <Badge variant="secondary" className="text-sm">
              {statistics.activeChapters} active
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
            <span className="hidden sm:inline">Add Chapter</span>
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
        <ChaptersFilters
          filters={filters}
          onFiltersChange={updateFilters}
          onClearFilters={clearFilters}
        />
      )}

      {/* Main Content Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
          <TabsTrigger value="overview" className="text-xs sm:text-sm py-2 px-2">Overview</TabsTrigger>
          <TabsTrigger value="chapters" className="text-xs sm:text-sm py-2 px-2">Chapters</TabsTrigger>
          <TabsTrigger value="leadership" className="text-xs sm:text-sm py-2 px-2">Leadership</TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs sm:text-sm py-2 px-2">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Chapter Status Summary */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Chapter Status Summary</h3>
              <div className="space-y-3">
                {chapters.map((chapter) => (
                  <div key={chapter.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                        <Building2 className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{chapter.displayName}</p>
                        <p className="text-sm text-muted-foreground">
                          {chapter.location.city}, {chapter.location.state}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={
                        chapter.status === "active" ? "default" :
                        chapter.status === "inactive" ? "secondary" :
                        chapter.status === "pending" ? "outline" : "destructive"
                      }>
                        {chapter.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Regional Distribution</h3>
              <div className="space-y-3">
                {statistics?.regionalBreakdown.map((region) => (
                  <div key={region.region} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                        <MapPin className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{region.region}</p>
                        <p className="text-sm text-muted-foreground">
                          {region.chapterCount} chapters
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{region.memberCount.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">
                        members
                      </p>
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
                <h3 className="text-lg font-semibold">Top Performing Chapters</h3>
                <div className="space-y-3">
                  {statistics.topPerformingChapters
                    .slice(0, 3)
                    .map((chapter) => (
                      <div key={chapter.chapterId} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="min-w-0 flex-1 mr-2">
                          <p className="font-medium">{chapter.chapterName}</p>
                          <p className="text-sm text-muted-foreground">
                            {chapter.location} • {chapter.memberCount} members
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`text-lg font-bold ${
                            chapter.growthRate >= 0 ? "text-emerald-600" : "text-rose-600"
                          }`}>
                            {chapter.growthRate.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Member Growth</h3>
                <div className="space-y-3">
                  {statistics.monthlyTrend.slice(0, 3).map((trend, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="min-w-0 flex-1 mr-2">
                        <p className="font-medium">{trend.month}</p>
                        <p className="text-sm text-muted-foreground">
                          {trend.eventCount} events
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-lg font-bold">{trend.memberCount.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">
                          {trend.attendanceRate.toFixed(1)}% attendance
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="chapters" className="space-y-6">
          <ChaptersTable
            chapters={chapters}
            onViewDetails={handleViewDetails}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleStatus={handleToggleStatus}
          />
        </TabsContent>

        <TabsContent value="leadership" className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Chapter Leadership Overview</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {chapters.map((chapter) => (
                <div key={chapter.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">{chapter.displayName}</h4>
                    <Badge variant="outline">{chapter.leadership.length} leaders</Badge>
                  </div>
                  <div className="space-y-2">
                    {chapter.leadership.slice(0, 3).map((leader) => (
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
                    {chapter.leadership.length > 3 && (
                      <p className="text-xs text-muted-foreground">
                        +{chapter.leadership.length - 3} more leaders
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
            {/* Chapter Performance */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Chapter Performance</h3>
              <div className="space-y-3">
                {statistics?.topPerformingChapters.map((chapter) => (
                  <div key={chapter.chapterId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="min-w-0 flex-1 mr-2">
                      <p className="font-medium">{chapter.chapterName}</p>
                      <p className="text-sm text-muted-foreground">
                        {chapter.memberCount} members • {chapter.eventCount} events
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold">
                        {chapter.engagementScore.toFixed(1)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        engagement score
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Regional Analytics */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Regional Analytics</h3>
              <div className="space-y-3">
                {statistics?.regionalBreakdown.map((region) => (
                  <div key={region.region} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="min-w-0 flex-1 mr-2">
                      <p className="font-medium">{region.region}</p>
                      <p className="text-sm text-muted-foreground">
                        {region.chapterCount} chapters
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold">
                        {region.totalRevenue.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        total revenue
                      </p>
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
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="min-w-0 flex-1 mr-2">
                      <p className="font-medium">{trend.month}</p>
                      <p className="text-sm text-muted-foreground">
                        {trend.eventCount} events • {trend.memberCount} members
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold">
                        ${trend.revenue.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {trend.attendanceRate.toFixed(1)}% attendance
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modals */}

      <AddChapterForm
        open={showAddForm}
        onOpenChange={setShowAddForm}
        onSubmit={handleFormSubmit}
        initialData={editingChapter || undefined}
        isEditing={!!editingChapter}
      />
    </div>
  );
}