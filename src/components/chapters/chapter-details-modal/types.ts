import type { Chapter } from "@/types/chapter.types";

export interface ChapterDetailsModalProps {
  chapter: Chapter | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (chapter: Chapter) => void;
  onToggleStatus: (chapter: Chapter, status: "active" | "inactive") => void;
}
