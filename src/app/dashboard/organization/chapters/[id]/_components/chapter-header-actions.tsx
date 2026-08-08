import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Power, PowerOff } from "lucide-react";
import type { Chapter } from "@/types/chapter.types";
import { getStatusIcon, getStatusBadge } from "./chapter-helpers";

interface ChapterHeaderActionsProps {
  chapter: Chapter;
  onBack: () => void;
  onEdit: () => void;
  onToggleStatus: (status: "active" | "inactive") => Promise<void>;
}

export function ChapterHeaderActions({
  chapter,
  onBack,
  onEdit,
  onToggleStatus,
}: ChapterHeaderActionsProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <Button onClick={onBack} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Chapters
        </Button>
        <div className="flex items-center gap-2">
          {getStatusIcon(chapter.status)}
          {getStatusBadge(chapter.status)}
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onEdit}>
          <Edit className="mr-2 h-4 w-4" />
          Edit Chapter
        </Button>
        <Button
          variant="outline"
          onClick={() => onToggleStatus(chapter.status === "active" ? "inactive" : "active")}
        >
          {chapter.status === "active" ? (
            <>
              <PowerOff className="mr-2 h-4 w-4" />
              Deactivate
            </>
          ) : (
            <>
              <Power className="mr-2 h-4 w-4" />
              Activate
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
