import { TabsContent } from "@/components/ui/tabs";
import { CommitteesTable } from "@/components/committees/committees-table";
import type { Committee } from "@/types/committee";

interface CommitteesListTabProps {
  committees: Committee[];
  onViewDetails: (committee: Committee) => void;
  onEdit: (committee: Committee) => void;
  onDelete: (committee: Committee) => void;
  onToggleStatus: (committee: Committee, status: "active" | "inactive") => void;
}

export function CommitteesListTab({
  committees,
  onViewDetails,
  onEdit,
  onDelete,
  onToggleStatus,
}: CommitteesListTabProps) {
  return (
    <TabsContent value="committees" className="space-y-6">
      <CommitteesTable
        committees={committees}
        onViewDetails={onViewDetails}
        onEdit={onEdit}
        onDelete={onDelete}
        onToggleStatus={onToggleStatus}
      />
    </TabsContent>
  );
}
