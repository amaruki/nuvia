import type { CommitteeWorkspace } from "@/types/committee";

export interface WorkspacesTableProps {
  workspaces: CommitteeWorkspace[];
  onViewDetails: (workspace: CommitteeWorkspace) => void;
  onEdit: (workspace: CommitteeWorkspace) => void;
  onDelete: (workspace: CommitteeWorkspace) => void;
  onToggleStatus: (workspace: CommitteeWorkspace, status: "active" | "archived") => void;
}
