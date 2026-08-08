"use client";

import { AddAnnouncementForm } from "@/components/content/add-announcement-form";
import { Button } from "@/components/ui/button";
import type { AnnouncementFormData } from "@/types/announcement.types";

interface AddAnnouncementViewProps {
  onSubmit: (data: AnnouncementFormData) => void;
  onCancel: () => void;
}

export function AddAnnouncementView({ onSubmit, onCancel }: AddAnnouncementViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Create New Announcement</h2>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
      <AddAnnouncementForm onSubmit={onSubmit} onCancel={onCancel} />
    </div>
  );
}
