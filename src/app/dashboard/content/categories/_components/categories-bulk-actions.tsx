import { Button } from "@/components/ui/button";
import { Archive, Folder, Trash2 } from "lucide-react";

interface CategoriesBulkActionsProps {
  selectedCount: number;
  onActivate: () => void;
  onArchive: () => void;
  onDelete: () => void;
}

export function CategoriesBulkActions({
  selectedCount,
  onActivate,
  onArchive,
  onDelete,
}: CategoriesBulkActionsProps) {
  return (
    <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg border">
      <span className="text-sm font-medium">Bulk Actions:</span>
      <Button variant="outline" size="sm" onClick={onActivate}>
        <Folder className="mr-2 h-4 w-4" />
        Activate ({selectedCount})
      </Button>
      <Button variant="outline" size="sm" onClick={onArchive}>
        <Archive className="mr-2 h-4 w-4" />
        Archive ({selectedCount})
      </Button>
      <Button variant="destructive" size="sm" onClick={onDelete}>
        <Trash2 className="mr-2 h-4 w-4" />
        Delete ({selectedCount})
      </Button>
    </div>
  );
}
