"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useHeader } from "@/contexts/dashboard-context";
import { useAnnouncements } from "@/lib/hooks/use-announcements";
import { logger } from "@/lib/logger";
import { AddAnnouncementForm } from "@/components/content/add-announcement-form";
import { Skeleton } from "@/components/ui/skeleton";
import { AnnouncementFormData } from "@/types/announcement";

export default function EditAnnouncementPage() {
  const params = useParams();
  const router = useRouter();
  const { setHeader, clearHeader } = useHeader();
  const { getAnnouncement, updateAnnouncement } = useAnnouncements();

  const [announcement, setAnnouncement] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const announcementId = params.id as string;

  useEffect(() => {
    setHeader({
      title: "Edit Announcement",
      description: "Update and modify your existing announcement",
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
          // Convert announcement to form data format
          const formData: Partial<AnnouncementFormData> = {
            title: foundAnnouncement.title,
            slug: foundAnnouncement.slug,
            excerpt: foundAnnouncement.excerpt,
            content: foundAnnouncement.content,
            type: foundAnnouncement.type,
            priority: foundAnnouncement.priority,
            targetAudience: foundAnnouncement.targetAudience,
            status: foundAnnouncement.status,
            authorId: foundAnnouncement.author.id,
            tagIds: foundAnnouncement.tags.map((tag) => tag.id),
            featuredImage: foundAnnouncement.featuredImage,
            expiresAt: foundAnnouncement.expiresAt,
            isPinned: foundAnnouncement.isPinned,
            isUrgent: foundAnnouncement.isUrgent,
            requiresAcknowledgment: foundAnnouncement.requiresAcknowledgment,
            sendEmailNotification: foundAnnouncement.sendEmailNotification,
            sendPushNotification: foundAnnouncement.sendPushNotification,
            displayOnHomepage: foundAnnouncement.displayOnHomepage,
            displayInDashboard: foundAnnouncement.displayInDashboard,
            visibility: foundAnnouncement.visibility,
            commentsEnabled: foundAnnouncement.commentsEnabled,
            sharingEnabled: foundAnnouncement.sharingEnabled,
            downloadEnabled: foundAnnouncement.downloadEnabled,
            isFeatured: foundAnnouncement.isFeatured,
          };

          setAnnouncement(formData);
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

  const handleSubmit = async (data: AnnouncementFormData) => {
    try {
      await updateAnnouncement(announcementId, data);
      router.push("/dashboard/content/announcements");
    } catch (error) {
      logger.error("Error updating announcement", error);
    }
  };

  const handleCancel = () => {
    router.push("/dashboard/content/announcements");
  };

  if (loading) {
    return (
      <div className="max-w-5xl">
        <div className="space-y-4">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl text-center">
        <div className="space-y-4">
          <h1 className="text-2xl font-bold text-destructive">Error</h1>
          <p className="text-muted-foreground">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!announcement) {
    return (
      <div className="max-w-5xl text-center">
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">Announcement not found</h1>
          <p className="text-muted-foreground">
            The announcement you're trying to edit doesn't exist.
          </p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <AddAnnouncementForm
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      initialData={announcement}
    />
  );
}
