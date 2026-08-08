import { ArrowLeft, Edit, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

interface AnnouncementHeaderProps {
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function AnnouncementHeader({ onBack, onEdit, onDelete }: AnnouncementHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <Button variant="outline" onClick={onBack}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Announcements
      </Button>

      <div className="flex gap-2">
        <Button variant="outline" onClick={onEdit}>
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </Button>
        <Button variant="destructive" onClick={onDelete}>
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
      </div>
    </div>
  );
}
