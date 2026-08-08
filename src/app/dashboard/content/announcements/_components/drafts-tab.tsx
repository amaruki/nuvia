"use client";

import { Megaphone, Settings } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Announcement } from "@/types/announcement";

interface DraftsTabProps {
  announcements: Announcement[];
  onEdit: (announcement: Announcement) => void;
  onPublish: (announcement: Announcement) => void;
}

export function DraftsTab({ announcements, onEdit, onPublish }: DraftsTabProps) {
  const drafts = announcements.filter((announcement) => announcement.status === "draft");

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Draft Announcements</h3>
      <div className="space-y-3">
        {drafts.slice(0, 10).map((announcement) => (
          <div
            key={announcement.id}
            className="flex items-center justify-between p-3 border rounded-lg"
          >
            <div className="min-w-0 flex-1 mr-2">
              <p className="font-medium">{announcement.title}</p>
              <p className="text-xs text-muted-foreground">
                Last modified: {announcement.lastModified.toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => onEdit(announcement)}>
                <Settings className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button size="sm" onClick={() => onPublish(announcement)}>
                <Megaphone className="mr-2 h-4 w-4" />
                Publish
              </Button>
            </div>
          </div>
        ))}
      </div>
      {drafts.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Megaphone className="h-12 w-12 mx-auto mb-4 opacity-40" />
          <h3 className="text-lg font-medium mb-2">No draft announcements</h3>
          <p className="text-sm">
            All your announcements are published. Create a new draft to get started.
          </p>
        </div>
      )}
    </div>
  );
}
