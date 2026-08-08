"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useHeader } from "@/contexts/dashboard-context";
import { logger } from "@/lib/logger";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CommitteeWorkspace } from "@/types/committee.types";
import {
  ArrowLeft,
  Calendar,
  Users,
  Clock,
  CheckSquare,
  Briefcase,
  Edit,
  Download,
  FileText,
  MessageSquare,
  Activity,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { apiFetch } from "@/lib/api-client";
import { toWorkspaceUi, type WireWorkspace } from "@/lib/hooks/use-workspaces";

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

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "default" as const,
      archived: "secondary" as const,
      locked: "destructive" as const,
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const colors = {
      general: "bg-blue-100 text-blue-800 border-blue-200",
      project: "bg-purple-100 text-purple-800 border-purple-200",
      document: "bg-green-100 text-green-800 border-green-200",
      discussion: "bg-orange-100 text-orange-800 border-orange-200",
      meeting: "bg-indigo-100 text-indigo-800 border-indigo-200",
    };

    return (
      <Badge
        variant="outline"
        className={
          colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800 border-gray-200"
        }
      >
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
  };

  const getTaskStatusBadge = (status: string) => {
    const variants = {
      todo: "outline" as const,
      in_progress: "default" as const,
      review: "secondary" as const,
      completed: "default" as const,
      cancelled: "destructive" as const,
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        {status.replace("_", " ").charAt(0).toUpperCase() + status.replace("_", " ").slice(1)}
      </Badge>
    );
  };

  const getTaskPriorityBadge = (priority: string) => {
    const colors = {
      low: "bg-gray-100 text-gray-800 border-gray-200",
      medium: "bg-blue-100 text-blue-800 border-blue-200",
      high: "bg-orange-100 text-orange-800 border-orange-200",
      urgent: "bg-red-100 text-red-800 border-red-200",
    };

    return (
      <Badge
        variant="outline"
        className={
          colors[priority as keyof typeof colors] || "bg-gray-100 text-gray-800 border-gray-200"
        }
      >
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </Badge>
    );
  };

  const getDocumentStatusBadge = (status: string) => {
    const variants = {
      draft: "outline" as const,
      review: "secondary" as const,
      approved: "default" as const,
      archived: "destructive" as const,
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getDiscussionStatusBadge = (status: string) => {
    const variants = {
      active: "default" as const,
      closed: "secondary" as const,
      archived: "destructive" as const,
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getMeetingStatusBadge = (status: string) => {
    const variants = {
      scheduled: "outline" as const,
      in_progress: "default" as const,
      completed: "secondary" as const,
      cancelled: "destructive" as const,
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        {status.replace("_", " ").charAt(0).toUpperCase() + status.replace("_", " ").slice(1)}
      </Badge>
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Workspaces
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button size="sm">
            <Edit className="mr-2 h-4 w-4" />
            Edit Workspace
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6 text-center">
            <Users className="h-8 w-8 mx-auto mb-2 text-blue-500" />
            <div className="text-2xl font-bold">{workspace.members.length}</div>
            <p className="text-sm text-muted-foreground">Total Members</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <FileText className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
            <div className="text-2xl font-bold">{workspace.documents.length}</div>
            <p className="text-sm text-muted-foreground">Documents</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <CheckSquare className="h-8 w-8 mx-auto mb-2 text-purple-500" />
            <div className="text-2xl font-bold">{workspace.tasks.length}</div>
            <p className="text-sm text-muted-foreground">Tasks</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 text-orange-500" />
            <div className="text-2xl font-bold">{workspace.discussions.length}</div>
            <p className="text-sm text-muted-foreground">Discussions</p>
          </CardContent>
        </Card>
      </div>

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

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status</span>
                  {getStatusBadge(workspace.status)}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Type</span>
                  {getTypeBadge(workspace.type)}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Visibility</span>
                  <Badge variant={workspace.settings.isPublic ? "default" : "secondary"}>
                    {workspace.settings.isPublic ? "Public" : "Private"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Created</span>
                  <span className="text-sm text-muted-foreground">
                    {formatDistanceToNow(workspace.createdAt, { addSuffix: true })}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Last Updated</span>
                  <span className="text-sm text-muted-foreground">
                    {formatDistanceToNow(workspace.updatedAt, { addSuffix: true })}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Workspace Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">Guest Access</span>
                  </div>
                  <Badge variant={workspace.settings.allowGuestAccess ? "default" : "secondary"}>
                    {workspace.settings.allowGuestAccess ? "Allowed" : "Not Allowed"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Approval Required</span>
                  </div>
                  <Badge variant={workspace.settings.requireApproval ? "default" : "secondary"}>
                    {workspace.settings.requireApproval ? "Required" : "Not Required"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-medium">Notifications</span>
                  </div>
                  <Badge variant={workspace.settings.enableNotifications ? "default" : "secondary"}>
                    {workspace.settings.enableNotifications ? "Enabled" : "Disabled"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-medium">Auto Archive</span>
                  </div>
                  <span className="text-sm font-medium">
                    {workspace.settings.autoArchiveDays} days
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workspace.activity.slice(0, 5).map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                        <Activity className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{activity.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {activity.type.replace("_", " ")} • {activity.targetType}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(activity.createdAt, { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Workspace Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workspace.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={member.avatar} alt={member.name} />
                        <AvatarFallback>
                          {member.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Joined {formatDistanceToNow(member.joinedAt, { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <Badge variant={member.isActive ? "default" : "secondary"}>
                          {member.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {member.role.replace("_", " ")}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
                {workspace.members.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No members in this workspace yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Workspace Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workspace.documents.map((document) => (
                  <div
                    key={document.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{document.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {document.fileName} • {formatFileSize(document.fileSize)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Uploaded {formatDistanceToNow(document.uploadedAt, { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {document.fileType}
                        </Badge>
                        {getDocumentStatusBadge(document.status)}
                      </div>
                    </div>
                  </div>
                ))}
                {workspace.documents.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No documents in this workspace yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Workspace Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workspace.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                        <CheckSquare className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{task.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {task.assignedTo.length} assigned • {task.comments.length} comments
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Created {formatDistanceToNow(task.createdAt, { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        {getTaskStatusBadge(task.status)}
                        {getTaskPriorityBadge(task.priority)}
                      </div>
                    </div>
                  </div>
                ))}
                {workspace.tasks.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No tasks in this workspace yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="discussions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Workspace Discussions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workspace.discussions.map((discussion) => (
                  <div
                    key={discussion.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                        <MessageSquare className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{discussion.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {discussion.replyCount} replies • {discussion.viewCount} views
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Started {formatDistanceToNow(discussion.createdAt, { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        {getDiscussionStatusBadge(discussion.status)}
                        {discussion.isPinned && (
                          <Badge variant="outline" className="text-xs">
                            Pinned
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {workspace.discussions.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No discussions in this workspace yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="meetings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Workspace Meetings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workspace.meetings.map((meeting) => (
                  <div
                    key={meeting.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                        <Calendar className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{meeting.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {meeting.attendees.length} attendees • {meeting.agenda.length} agenda
                          items
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {meeting.startTime.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        {getMeetingStatusBadge(meeting.status)}
                        {meeting.isVirtual && (
                          <Badge variant="outline" className="text-xs">
                            Virtual
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {workspace.meetings.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No meetings in this workspace yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
