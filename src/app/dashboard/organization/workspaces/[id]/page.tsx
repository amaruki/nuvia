"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useHeader } from "@/contexts/dashboard-context";
import { logger } from "@/lib/logger";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CommitteeWorkspace } from "@/types/committee";
import { ArrowLeft, Briefcase } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { toWorkspaceUi, type WireWorkspace } from "@/lib/hooks/use-workspaces";
import { WorkspaceHeader } from "./_components/workspace-header";
import { WorkspaceStats } from "./_components/workspace-stats";
import { OverviewTab } from "./_components/overview-tab";
import { MembersTab } from "./_components/members-tab";
import { DocumentsTab } from "./_components/documents-tab";
import { TasksTab } from "./_components/tasks-tab";
import { DiscussionsTab } from "./_components/discussions-tab";
import { MeetingsTab } from "./_components/meetings-tab";

export default function WorkspaceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [workspace, setWorkspace] = useState<CommitteeWorkspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const { setHeader, clearHeader } = useHeader();

  const workspaceId = params.id as string;

  useEffect(() => {
    // Set header title when workspace is loaded
    if (workspace) {
      setHeader({
        title: workspace.name,
        description: workspace.description || "Workspace details and management",
      });
    }

    return () => {
      clearHeader();
    };
  }, [workspace, setHeader, clearHeader]);

  useEffect(() => {
    // Fetch workspace details from the real workspaces API
    const fetchWorkspace = async () => {
      setLoading(true);
      try {
        const { data } = await apiFetch<WireWorkspace>(`/api/v1/workspaces/${workspaceId}`);
        setWorkspace(toWorkspaceUi(data));
      } catch (error) {
        logger.error("Error fetching workspace", error);
        setWorkspace(null);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkspace();
  }, [workspaceId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-48 mb-4"></div>
          <div className="h-4 bg-muted rounded w-32 mb-2"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <Briefcase className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-semibold mb-2">Workspace Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The workspace you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <WorkspaceHeader />
      <WorkspaceStats workspace={workspace} />

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="discussions">Discussions</TabsTrigger>
          <TabsTrigger value="meetings">Meetings</TabsTrigger>
        </TabsList>

        <OverviewTab workspace={workspace} />
        <MembersTab workspace={workspace} />
        <DocumentsTab workspace={workspace} />
        <TasksTab workspace={workspace} />
        <DiscussionsTab workspace={workspace} />
        <MeetingsTab workspace={workspace} />
      </Tabs>
    </div>
  );
}
