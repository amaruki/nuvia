import type { Committee } from "@/types/committee";

export interface CommitteesTableProps {
  committees: Committee[];
  onViewDetails: (committee: Committee) => void;
  onEdit: (committee: Committee) => void;
  onDelete: (committee: Committee) => void;
  onToggleStatus: (committee: Committee, status: "active" | "inactive") => void;
}
