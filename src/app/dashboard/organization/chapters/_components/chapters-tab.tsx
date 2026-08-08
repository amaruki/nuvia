"use client";

import { ChaptersTable } from "@/components/chapters/chapters-table";
import type { Chapter } from "@/types/chapter.types";

interface ChaptersTabProps {
  chapters: Chapter[];
  onViewDetails: (chapter: Chapter) => void;
  onEdit: (chapter: Chapter) => void;
  onDelete: (chapter: Chapter) => void;
  onToggleStatus: (chapter: Chapter, status: "active" | "inactive") => void;
}

export function ChaptersTab({
  chapters,
  onViewDetails,
  onEdit,
  onDelete,
  onToggleStatus,
}: ChaptersTabProps) {
  return (
    <ChaptersTable
      chapters={chapters}
      onViewDetails={onViewDetails}
      onEdit={onEdit}
      onDelete={onDelete}
      onToggleStatus={onToggleStatus}
    />
  );
}
