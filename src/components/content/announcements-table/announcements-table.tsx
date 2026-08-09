"use client";

import { useState } from "react";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AnnouncementRow } from "./announcement-row";
import type { AnnouncementsTableProps } from "./types";

export function AnnouncementsTable({
  announcements,
  onView,
  onEdit,
  onDelete,
  onDuplicate,
  onStatusChange,
}: AnnouncementsTableProps) {
  const [selectedAnnouncements, setSelectedAnnouncements] = useState<string[]>([]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAnnouncements(announcements.map((a) => a.id));
    } else {
      setSelectedAnnouncements([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedAnnouncements([...selectedAnnouncements, id]);
    } else {
      setSelectedAnnouncements(selectedAnnouncements.filter((selectedId) => selectedId !== id));
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">
              <input
                type="checkbox"
                className="rounded border-gray-300"
                checked={selectedAnnouncements.length === announcements.length}
                onChange={(e) => handleSelectAll(e.target.checked)}
              />
            </TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Target Audience</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Author</TableHead>
            <TableHead>Acknowledgments</TableHead>
            <TableHead>Expires</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {announcements.map((announcement) => (
            <AnnouncementRow
              key={announcement.id}
              announcement={announcement}
              isSelected={selectedAnnouncements.includes(announcement.id)}
              onSelect={handleSelectOne}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
              onStatusChange={onStatusChange}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
