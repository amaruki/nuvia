import type { Chapter } from "@/types/chapter.types";

export interface ChaptersTableProps {
  chapters: Chapter[];
  onViewDetails: (chapter: Chapter) => void;
  onEdit: (chapter: Chapter) => void;
  onDelete: (chapter: Chapter) => void;
  onToggleStatus: (chapter: Chapter, status: "active" | "inactive") => void;
}
