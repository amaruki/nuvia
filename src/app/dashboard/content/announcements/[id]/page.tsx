"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useHeader } from "@/contexts/dashboard-context";
import { useAnnouncements } from "@/lib/hooks/use-announcements";
import { Announcement } from "@/types/announcement.types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Eye,
  Calendar,
  Users,
  Target,
  Bell,
  Zap,
  Pin,
  Clock,
  CheckCircle2,
  Archive,
  Share2,
  Download,
  Mail,
  Smartphone,
  Home,
  Layout,
  Star,
  AlertTriangle,
  Megaphone,
  ExternalLink,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function AnnouncementViewPage() {
  const params = useParams();
  const router = useRouter();
  const { setHeader, clearHeader } = useHeader();
  const { getAnnouncement, deleteAnnouncement, publishAnnouncement, archiveAnnouncement } =
    useAnnouncements();

  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const announcementId = params.id as string;

  useEffect(() => {
    setHeader({
      title: "Announcement Details",
      description: "View and manage announcement details",
    });

    return () => {
      clearHeader();
    };
  }, [setHeader, clearHeader]);

  useEffect(() => {
    const loadAnnouncement = async () => {
      try {
        setLoading(true);
        setError(null);

        const foundAnnouncement = getAnnouncement(announcementId);
        if (foundAnnouncement) {
          setAnnouncement(foundAnnouncement);
        } else {
          setError("Announcement not found");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load announcement");
      } finally {
        setLoading(false);
      }
    };

    if (announcementId) {
      loadAnnouncement();
    }
  }, [announcementId, getAnnouncement]);

  const handleEdit = () => {
    router.push(`/dashboard/content/announcements/edit/${announcementId}`);
  };

  const handleDelete = async () => {
    if (
      confirm(
        `Are you sure you want to delete "${announcement?.title}"? This action cannot be undone.`,
      )
    ) {
      try {
        await deleteAnnouncement(announcementId);
        router.push("/dashboard/content/announcements");
      } catch (error) {
        console.error("Error deleting announcement:", error);
      }
    }
  };

  const handlePublish = async () => {
    try {
      await publishAnnouncement(announcementId);
      router.refresh();
    } catch (error) {
      console.error("Error publishing announcement:", error);
    }
  };

  const handleArchive = async () => {
    try {
      await archiveAnnouncement(announcementId);
      router.refresh();
    } catch (error) {
      console.error("Error archiving announcement:", error);
    }
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "N/A";
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any }
    > = {
      draft: { label: "Draft", variant: "secondary", icon: Clock },
      published: { label: "Published", variant: "default", icon: CheckCircle2 },
      scheduled: { label: "Scheduled", variant: "outline", icon: Calendar },
      archived: { label: "Archived", variant: "secondary", icon: Archive },
    };

    const config = statusConfig[status] || statusConfig.draft;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      urgent: { label: "Urgent", variant: "destructive" as const, icon: AlertTriangle },
      high: { label: "High", variant: "default" as const, icon: Bell },
      medium: { label: "Medium", variant: "secondary" as const, icon: Star },
      low: { label: "Low", variant: "outline" as const, icon: Clock },
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.low;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="container max-w-5xl py-6 mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-5xl py-6 mx-auto text-center">
        <div className="space-y-4">
          <h1 className="text-2xl font-bold text-destructive">Error</h1>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={() => router.back()} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (!announcement) {
    return (
      <div className="container max-w-5xl py-6 mx-auto text-center">
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">Announcement not found</h1>
          <p className="text-muted-foreground">
            The announcement you're looking for doesn't exist.
          </p>
          <Button onClick={() => router.back()} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl py-6 mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Announcements
        </Button>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title and Status */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">{announcement.title}</CardTitle>
                <div className="flex items-center gap-2">
                  {getStatusBadge(announcement.status)}
                  {getPriorityBadge(announcement.priority)}
                  {announcement.isPinned && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Pin className="h-3 w-3" />
                      Pinned
                    </Badge>
                  )}
                  {announcement.isUrgent && (
                    <Badge variant="destructive" className="flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      Urgent
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">{announcement.excerpt}</p>
              <div className="prose max-w-none">
                <div dangerouslySetInnerHTML={{ __html: announcement.content }} />
              </div>
            </CardContent>
          </Card>

          {/* Featured Image */}
          {announcement.featuredImage && (
            <Card>
              <CardHeader>
                <CardTitle>Featured Image</CardTitle>
              </CardHeader>
              <CardContent>
                <img
                  src={announcement.featuredImage}
                  alt={announcement.title}
                  className="w-full rounded-lg"
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Metadata */}
        <div className="space-y-6">
          {/* Announcement Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="h-5 w-5" />
                Announcement Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Published:</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatDate(announcement.publishedAt || null)}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Target Audience:</span>
                </div>
                <p className="text-sm text-muted-foreground capitalize">
                  {announcement.targetAudience?.replace("_", " ")}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Type:</span>
                </div>
                <p className="text-sm text-muted-foreground capitalize">
                  {announcement.type?.replace("_", " ")}
                </p>
              </div>

              {announcement.expiresAt && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Expires:</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(announcement.expiresAt)}
                  </p>
                </div>
              )}

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Views:</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {announcement.metrics.views.toLocaleString()}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Engagement:</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {announcement.metrics.engagementScore}%
                </p>
              </div>

              {(announcement.acknowledgmentCount || 0) > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Acknowledgments:</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {(announcement.acknowledgmentCount || 0).toLocaleString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Author Information */}
          <Card>
            <CardHeader>
              <CardTitle>Author</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                {announcement.author.avatar && (
                  <img
                    src={announcement.author.avatar}
                    alt={announcement.author.name}
                    className="w-10 h-10 rounded-full"
                  />
                )}
                <div>
                  <p className="font-medium">{announcement.author.name}</p>
                  <p className="text-sm text-muted-foreground">{announcement.author.role}</p>
                  {announcement.author.chapter && (
                    <p className="text-xs text-muted-foreground">{announcement.author.chapter}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Display Options */}
          <Card>
            <CardHeader>
              <CardTitle>Display Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Homepage:</span>
                <Badge variant={announcement.displayOnHomepage ? "default" : "secondary"}>
                  {announcement.displayOnHomepage ? "Yes" : "No"}
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <Layout className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Dashboard:</span>
                <Badge variant={announcement.displayInDashboard ? "default" : "secondary"}>
                  {announcement.displayInDashboard ? "Yes" : "No"}
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Email:</span>
                <Badge variant={announcement.sendEmailNotification ? "default" : "secondary"}>
                  {announcement.sendEmailNotification ? "Yes" : "No"}
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Push:</span>
                <Badge variant={announcement.sendPushNotification ? "default" : "secondary"}>
                  {announcement.sendPushNotification ? "Yes" : "No"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {announcement.status === "draft" && (
                <Button onClick={handlePublish} className="w-full">
                  <Megaphone className="mr-2 h-4 w-4" />
                  Publish Announcement
                </Button>
              )}

              {announcement.status === "published" && (
                <Button onClick={handleArchive} variant="outline" className="w-full">
                  <Archive className="mr-2 h-4 w-4" />
                  Archive Announcement
                </Button>
              )}

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1">
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
                <Button variant="outline" className="flex-1">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
