import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import { Calendar, Download, User } from "lucide-react";
import type { FinancialReport } from "@/types/finance";
import { formatDate } from "./helpers";
import ReportActions from "./report-actions";
import getReportTypeIcon from "./report-type-icon";
import getStatusBadge from "./status-badge";
import type { ReportItemActions } from "./types";

interface ReportRowProps extends ReportItemActions {
  report: FinancialReport;
  selected: boolean;
  onSelect: (reportId: string, checked: boolean) => void;
}

export default function ReportRow({
  report,
  selected,
  onSelect,
  onViewDetails,
  onDownload,
  onEdit,
  onDelete,
  onUpdateStatus,
}: ReportRowProps) {
  return (
    <TableRow className="hover:bg-muted/50">
      <TableCell>
        <input
          type="checkbox"
          className="rounded border-gray-300"
          checked={selected}
          onChange={(e) => onSelect(report.id, e.target.checked)}
        />
      </TableCell>
      <TableCell className="min-w-[200px]">
        <div className="space-y-1">
          <div className="font-medium truncate max-w-[180px]" title={report.title}>
            {report.title}
          </div>
          <div className="text-sm text-muted-foreground line-clamp-2 max-w-[180px]">
            {report.description}
          </div>
          {report.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {report.tags.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {report.tags.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{report.tags.length - 2}
                </Badge>
              )}
            </div>
          )}
        </div>
      </TableCell>
      <TableCell className="min-w-[120px]">
        <div className="flex items-center gap-2">
          {getReportTypeIcon(report.type)}
          <span className="capitalize text-sm">{report.type.replace("_", " ")}</span>
        </div>
      </TableCell>
      <TableCell className="min-w-[100px]">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{report.period}</span>
        </div>
      </TableCell>
      <TableCell className="min-w-[120px]">{getStatusBadge(report.status)}</TableCell>
      <TableCell className="min-w-[120px] hidden sm:table-cell">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm truncate max-w-[100px]" title={report.generatedBy}>
            {report.generatedBy}
          </span>
        </div>
      </TableCell>
      <TableCell className="min-w-[100px] hidden md:table-cell">
        <div className="text-sm">{formatDate(report.generatedAt)}</div>
      </TableCell>
      <TableCell className="min-w-[100px] hidden lg:table-cell">
        <div className="flex items-center gap-2">
          <Download className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{report.downloadCount}</span>
        </div>
      </TableCell>
      <TableCell className="w-[80px] text-right">
        <ReportActions
          report={report}
          onViewDetails={onViewDetails}
          onDownload={onDownload}
          onEdit={onEdit}
          onDelete={onDelete}
          onUpdateStatus={onUpdateStatus}
        />
      </TableCell>
    </TableRow>
  );
}
