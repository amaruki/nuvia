"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useChapters } from "@/lib/hooks/use-chapters";
import { useHeader } from "@/contexts/dashboard-context";
import { logger } from "@/lib/logger";
import { ChapterEventsTab } from "./_components/chapter-events-tab";
import { ChapterFinancesTab } from "./_components/chapter-finances-tab";
import { ChapterHeaderActions } from "./_components/chapter-header-actions";
import { ChapterLeadershipTab } from "./_components/chapter-leadership-tab";
import { ChapterMetricsTab } from "./_components/chapter-metrics-tab";
import { ChapterOverviewTab } from "./_components/chapter-overview-tab";
import { ChapterLoading, ChapterError, ChapterNotFound } from "./_components/chapter-states";

export default function ChapterDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);
  const { setHeader, clearHeader } = useHeader();

  const { chapters, loading, error, refreshData, toggleChapterStatus } = useChapters();

  const chapterId = params.id as string;
  const chapter = chapters.find((c) => c.id === chapterId);

  useEffect(() => {
    if (chapter) {
      setHeader({
        title: chapter.displayName,
        description: `Chapter details and management for ${chapter.displayName}`,
      });
    }

    return () => {
      clearHeader();
    };
  }, [chapter, setHeader, clearHeader]);

  const handleToggleStatus = async (status: "active" | "inactive") => {
    if (!chapter) return;
    try {
      await toggleChapterStatus(chapter.id, status);
    } catch (error) {
      logger.error("Error toggling chapter status", error);
    }
  };

  const handleEdit = () => {
    // TODO: Navigate to edit page or open edit modal
    setIsEditing(true);
  };

  const handleBack = () => {
    router.push("/dashboard/organization/chapters");
  };

  if (loading) {
    return <ChapterLoading />;
  }

  if (error) {
    return <ChapterError error={error} onBack={handleBack} onRetry={refreshData} />;
  }

  if (!chapter) {
    return <ChapterNotFound onBack={handleBack} />;
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <ChapterHeaderActions
        chapter={chapter}
        onBack={handleBack}
        onEdit={handleEdit}
        onToggleStatus={handleToggleStatus}
      />

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="leadership">Leadership</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="finances">Finances</TabsTrigger>
        </TabsList>

        <ChapterOverviewTab chapter={chapter} />
        <ChapterLeadershipTab chapter={chapter} />
        <ChapterMetricsTab chapter={chapter} />
        <ChapterEventsTab chapter={chapter} />
        <ChapterFinancesTab chapter={chapter} />
      </Tabs>
    </div>
  );
}
