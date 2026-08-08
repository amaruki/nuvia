import type { Publication } from "@/types/publication";

export interface PublicationsTableProps {
  publications: Publication[];
  onViewDetails: (publication: Publication) => void;
  onEdit: (publication: Publication) => void;
  onDelete: (publication: Publication) => void;
  onDuplicate: (publication: Publication) => void;
  onPublish: (publication: Publication) => void;
  onArchive: (publication: Publication) => void;
  onSchedule: (publication: Publication, date: Date) => void;
  selectedPublications?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
}
