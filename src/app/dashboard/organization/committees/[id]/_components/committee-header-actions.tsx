import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Edit } from "lucide-react";

interface CommitteeHeaderActionsProps {
  onBack: () => void;
}

export function CommitteeHeaderActions({ onBack }: CommitteeHeaderActionsProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Committees
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
        <Button size="sm">
          <Edit className="mr-2 h-4 w-4" />
          Edit Committee
        </Button>
      </div>
    </div>
  );
}
