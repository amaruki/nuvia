"use client";

import { useRouter } from "next/navigation";
import { useHeader } from "@/contexts/dashboard-context";
import { useAnnouncements } from "@/lib/hooks/use-announcements";
import { logger } from "@/lib/logger";
import { AddAnnouncementForm } from "@/components/content/add-announcement-form";
import { AnnouncementFormData } from "@/types/announcement";
import { useEffect } from "react";

export default function CreateAnnouncementPage() {
  const router = useRouter();
  const { setHeader, clearHeader } = useHeader();
  const { addAnnouncement } = useAnnouncements();

  useEffect(() => {
    setHeader({
      title: "Create New Announcement",
      description: "Create and publish a new announcement for the community",
    });

    return () => {
      clearHeader();
    };
  }, [setHeader, clearHeader]);

  const handleSubmit = async (data: AnnouncementFormData) => {
    try {
      await addAnnouncement(data);
      router.push("/dashboard/content/announcements");
    } catch (error) {
      logger.error("Error creating announcement", error);
    }
  };

  const handleCancel = () => {
    router.push("/dashboard/content/announcements");
  };

  return <AddAnnouncementForm onSubmit={handleSubmit} onCancel={handleCancel} />;
}
