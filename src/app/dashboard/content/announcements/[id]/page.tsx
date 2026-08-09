"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useHeader } from "@/contexts/dashboard-context";
import { useAnnouncements } from "@/lib/hooks/use-announcements";
import { logger } from "@/lib/logger";
import type { Announcement } from "@/types/announcement";
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

import { AnnouncementActionsCard } from "./_components/announcement-actions-card";
import { AnnouncementAuthorCard } from "./_components/announcement-author-card";
import {
  AnnouncementContentCard,
  AnnouncementFeaturedImageCard,
} from "./_components/announcement-content-card";
import { AnnouncementDetailsCard } from "./_components/announcement-details-card";
import { AnnouncementDisplayOptionsCard } from "./_components/announcement-display-options-card";
import { AnnouncementHeader } from "./_components/announcement-header";
import {
  AnnouncementError,
  AnnouncementLoading,
  AnnouncementNotFound,
} from "./_components/announcement-states";

export default function AnnouncementViewPage() {
  const params = useParams();
  const router = useRouter();
  const { setHeader, clearHeader } = useHeader();
  const { getAnnouncement, deleteAnnouncement, publishAnnouncement, archiveAnnouncement } =
    useAnnouncements();

  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

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

  const handleDelete = () => {
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    setDeleteDialogOpen(false);
    try {
      await deleteAnnouncement(announcementId);
      router.push("/dashboard/content/announcements");
    } catch (error) {
      logger.error("Error deleting announcement", error);
    }
  };

  const handlePublish = async () => {
    try {
      await publishAnnouncement(announcementId);
      router.refresh();
    } catch (error) {
      logger.error("Error publishing announcement", error);
    }
  };

  const handleArchive = async () => {
    try {
      await archiveAnnouncement(announcementId);
      router.refresh();
    } catch (error) {
      logger.error("Error archiving announcement", error);
    }
  };

  if (loading) {
    return <AnnouncementLoading />;
  }

  if (error) {
    return <AnnouncementError error={error} onBack={() => router.back()} />;
  }

  if (!announcement) {
    return <AnnouncementNotFound onBack={() => router.back()} />;
  }

  return (
    <div className="container max-w-5xl py-6 mx-auto space-y-6">
      <AnnouncementHeader
        onBack={() => router.back()}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <AnnouncementContentCard announcement={announcement} />
          {announcement.featuredImage && (
            <AnnouncementFeaturedImageCard
              image={announcement.featuredImage}
              alt={announcement.title}
            />
          )}
        </div>

        {/* Right Column - Metadata */}
        <div className="space-y-6">
          <AnnouncementDetailsCard announcement={announcement} />
          <AnnouncementAuthorCard author={announcement.author} />
          <AnnouncementDisplayOptionsCard announcement={announcement} />
          <AnnouncementActionsCard
            status={announcement.status}
            onPublish={handlePublish}
            onArchive={handleArchive}
          />
        </div>
      </div>

      {/* Delete confirmation dialog (UI-06: replaces native confirm()). */}
      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) setDeleteDialogOpen(false);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete announcement?</AlertDialogTitle>
            <AlertDialogDescription>
              {`Are you sure you want to delete "${announcement.title}"? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
