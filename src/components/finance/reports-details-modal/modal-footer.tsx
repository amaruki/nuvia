"use client";

import { Download, Edit, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FinancialReport } from "@/types/finance";

interface ModalFooterProps {
  report: FinancialReport;
  onOpenChange: (open: boolean) => void;
  onDownload: (report: FinancialReport) => void;
  onEdit: (report: FinancialReport) => void;
  onShare: (report: FinancialReport) => void;
}

export default function ModalFooter({
  report,
  onOpenChange,
  onDownload,
  onEdit,
  onShare,
}: ModalFooterProps) {
  return (
    <div className="flex justify-between pt-4 border-t">
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => onEdit(report)}>
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>
        <Button variant="outline" onClick={() => onShare(report)}>
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Close
        </Button>
        <Button onClick={() => onDownload(report)}>
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
      </div>
    </div>
  );
}
