import { Archive, ArrowLeft, Download, Edit, FileText, Share2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Publication } from "@/types/publication";

interface PublicationHeaderActionsProps {
  publication: Publication;
  onBack: () => void;
  onEdit: () => void;
  onPublish: () => Promise<void>;
  onArchive: () => Promise<void>;
  onDelete: () => Promise<void>;
}

export function PublicationHeaderActions({
  publication,
  onBack,
  onEdit,
  onPublish,
  onArchive,
  onDelete,
}: PublicationHeaderActionsProps) {
  return (
    <div className="flex items-center justify-between">
      <Button variant="outline" onClick={onBack}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Publications
      </Button>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm">
          <Share2 className="mr-2 h-4 w-4" />
          Share
        </Button>
        <Button variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </Button>

        {publication.status === "draft" && (
          <Button size="sm" onClick={onPublish}>
            <FileText className="mr-2 h-4 w-4" />
            Publish
          </Button>
        )}

        {publication.status === "published" && (
          <Button variant="outline" size="sm" onClick={onArchive}>
            <Archive className="mr-2 h-4 w-4" />
            Archive
          </Button>
        )}

        <Button variant="destructive" size="sm" onClick={onDelete}>
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
      </div>
    </div>
  );
}
