"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Download,
  Eye,
  Edit,
  Trash2,
  FileText,
  BarChart3,
  PieChart,
  DollarSign,
  TrendingUp,
  Shield,
  Calendar,
  User,
  Tag,
} from "lucide-react";
import { FinancialReport } from "@/types/finance.types";
import { cn } from "@/lib/utils";

interface ReportsTableProps {
  reports: FinancialReport[];
  onViewDetails: (report: FinancialReport) => void;
  onDownload: (report: FinancialReport) => void;
  onEdit: (report: FinancialReport) => void;
  onDelete: (report: FinancialReport) => void;
  onUpdateStatus: (report: FinancialReport, status: FinancialReport['status']) => void;
}

export function ReportsTable({
  reports,
  onViewDetails,
  onDownload,
  onEdit,
  onDelete,
  onUpdateStatus,
}: ReportsTableProps) {
  const [selectedReports, setSelectedReports] = useState<string[]>([]);

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "N/A";
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + " " + sizes[i];
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case 'income_statement':
        return <BarChart3 className="h-4 w-4" />;
      case 'balance_sheet':
        return <PieChart className="h-4 w-4" />;
      case 'cash_flow':
        return <DollarSign className="h-4 w-4" />;
      case 'budget_vs_actual':
        return <TrendingUp className="h-4 w-4" />;
      case 'tax_document':
        return <FileText className="h-4 w-4" />;
      case 'audit_trail':
        return <Shield className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: FinancialReport['status']) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'pending_review':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Pending Review</Badge>;
      case 'approved':
        return <Badge variant="outline" className="border-blue-500 text-blue-600">Approved</Badge>;
      case 'published':
        return <Badge variant="default">Published</Badge>;
      case 'archived':
        return <Badge variant="outline">Archived</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleSelectReport = (reportId: string, checked: boolean) => {
    if (checked) {
      setSelectedReports(prev => [...prev, reportId]);
    } else {
      setSelectedReports(prev => prev.filter(id => id !== reportId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedReports(reports.map(report => report.id));
    } else {
      setSelectedReports([]);
    }
  };

  const handleBulkDownload = () => {
    selectedReports.forEach(reportId => {
      const report = reports.find(r => r.id === reportId);
      if (report) {
        onDownload(report);
      }
    });
    setSelectedReports([]);
  };

  const handleBulkDelete = () => {
    selectedReports.forEach(reportId => {
      const report = reports.find(r => r.id === reportId);
      if (report) {
        onDelete(report);
      }
    });
    setSelectedReports([]);
  };

  if (reports.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Reports Found</CardTitle>
          <CardDescription>
            There are no reports matching your current filters.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Try adjusting your filters or generate a new report.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Financial Reports</CardTitle>
            <CardDescription>
              Manage and view your financial reports and documentation
            </CardDescription>
          </div>
          {selectedReports.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {selectedReports.length} selected
              </span>
              <Button variant="outline" size="sm" onClick={handleBulkDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download Selected
              </Button>
              <Button variant="outline" size="sm" onClick={handleBulkDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300"
                    checked={selectedReports.length === reports.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </TableHead>
                <TableHead className="min-w-[200px]">Report</TableHead>
                <TableHead className="min-w-[120px]">Type</TableHead>
                <TableHead className="min-w-[100px]">Period</TableHead>
                <TableHead className="min-w-[120px]">Status</TableHead>
                <TableHead className="min-w-[120px] hidden sm:table-cell">Generated By</TableHead>
                <TableHead className="min-w-[100px] hidden md:table-cell">Generated</TableHead>
                <TableHead className="min-w-[100px] hidden lg:table-cell">Downloads</TableHead>
                <TableHead className="w-[80px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id} className="hover:bg-muted/50">
                  <TableCell>
                    <input
                      type="checkbox"
                      className="rounded border-gray-300"
                      checked={selectedReports.includes(report.id)}
                      onChange={(e) => handleSelectReport(report.id, e.target.checked)}
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
                      <span className="capitalize text-sm">
                        {report.type.replace('_', ' ')}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="min-w-[100px]">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{report.period}</span>
                    </div>
                  </TableCell>
                  <TableCell className="min-w-[120px]">
                    {getStatusBadge(report.status)}
                  </TableCell>
                  <TableCell className="min-w-[120px] hidden sm:table-cell">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm truncate max-w-[100px]" title={report.generatedBy}>
                        {report.generatedBy}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="min-w-[100px] hidden md:table-cell">
                    <div className="text-sm">
                      {formatDate(report.generatedAt)}
                    </div>
                  </TableCell>
                  <TableCell className="min-w-[100px] hidden lg:table-cell">
                    <div className="flex items-center gap-2">
                      <Download className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{report.downloadCount}</span>
                    </div>
                  </TableCell>
                  <TableCell className="w-[80px] text-right">
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
                            <DropdownMenuItem onClick={() => onUpdateStatus(report, 'draft')}>
                              Draft
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onUpdateStatus(report, 'pending_review')}>
                              Pending Review
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onUpdateStatus(report, 'approved')}>
                              Approved
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onUpdateStatus(report, 'published')}>
                              Published
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onUpdateStatus(report, 'archived')}>
                              Archived
                            </DropdownMenuItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onDelete(report)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

// DropdownMenuSub components (these might not be in your UI library, so I'm including them)
const DropdownMenuSub = ({ children }: { children: React.ReactNode }) => (
  <div className="relative">{children}</div>
);

const DropdownMenuSubTrigger = ({ children, ...props }: any) => (
  <DropdownMenuItem {...props} className="relative">
    {children}
    <span className="ml-auto">›</span>
  </DropdownMenuItem>
);

const DropdownMenuSubContent = ({ children }: { children: React.ReactNode }) => (
  <div className="absolute left-full top-0 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50">
    {children}
  </div>
);