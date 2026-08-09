"use client";

import { useState } from "react";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Chapter } from "@/types/chapter.types";
import { ChapterRow } from "./chapter-row";
import type { ChaptersTableProps } from "./types";

export function ChaptersTable({
  chapters,
  onViewDetails,
  onEdit,
  onDelete,
  onToggleStatus,
}: ChaptersTableProps) {
  const [togglingChapter, setTogglingChapter] = useState<string | null>(null);

  const handleToggleStatus = async (chapter: Chapter, status: "active" | "inactive") => {
    setTogglingChapter(chapter.id);
    try {
      await onToggleStatus(chapter, status);
    } finally {
      setTogglingChapter(null);
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Chapter</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Members</TableHead>
            <TableHead>Growth</TableHead>
            <TableHead>Events</TableHead>
            <TableHead>Revenue</TableHead>
            <TableHead>Financial Health</TableHead>
            <TableHead>Leadership</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {chapters.map((chapter) => (
            <ChapterRow
              key={chapter.id}
              chapter={chapter}
              isToggling={togglingChapter === chapter.id}
              onViewDetails={onViewDetails}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleStatus={handleToggleStatus}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
