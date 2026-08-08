import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, Edit, Eye, MoreHorizontal, Tag, Trash2 } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import type { FinancialReport } from "@/types/finance";
import type { ReportItemActions } from "./types";

interface ReportActionsProps extends ReportItemActions {
  report: FinancialReport;
}

export default function ReportActions({
  report,
  onViewDetails,
  onDownload,
  onEdit,
  onDelete,
  onUpdateStatus,
}: ReportActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => onViewDetails(report)}>
          <Eye className="mr-2 h-4 w-4" />
          View Details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onDownload(report)}>
          <Download className="mr-2 h-4 w-4" />
          Download
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEdit(report)}>
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Tag className="mr-2 h-4 w-4" />
            Update Status
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem onClick={() => onUpdateStatus(report, "draft")}>
              Draft
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onUpdateStatus(report, "pending_review")}>
              Pending Review
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onUpdateStatus(report, "approved")}>
              Approved
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onUpdateStatus(report, "published")}>
              Published
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onUpdateStatus(report, "archived")}>
              Archived
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onDelete(report)} className="text-destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// DropdownMenuSub components (these might not be in your UI library, so I'm including them)
const DropdownMenuSub = ({ children }: { children: ReactNode }) => (
  <div className="relative">{children}</div>
);

const DropdownMenuSubTrigger = ({
  children,
  ...props
}: ComponentProps<typeof DropdownMenuItem>) => (
  <DropdownMenuItem {...props} className="relative">
    {children}
    <span className="ml-auto">›</span>
  </DropdownMenuItem>
);

const DropdownMenuSubContent = ({ children }: { children: ReactNode }) => (
  <div className="absolute left-full top-0 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50">
    {children}
  </div>
);
