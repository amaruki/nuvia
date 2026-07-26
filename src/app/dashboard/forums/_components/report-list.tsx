"use client";

import React, { useState, useEffect } from "react";
import { ForumLayout } from "./forum-layout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Eye, ShieldAlert, CheckCircle, MoreHorizontal, Flag, RefreshCw } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { getMockReports, Report } from "@/lib/data/mock-forums";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { logger } from "@/lib/logger";

export function ReportList() {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const data = await getMockReports();
      setReports(data);
    } catch (error) {
      logger.error("Failed to load reports", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolve = (id: string) => {
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status: "RESOLVED" } : r)));
    if (selectedReport?.id === id) {
      setSelectedReport((prev) => (prev ? { ...prev, status: "RESOLVED" } : null));
    }
    // In real app, call resolve API
  };

  const viewDetails = (report: Report) => {
    setSelectedReport(report);
    setIsDetailsOpen(true);
  };

  return (
    <ForumLayout
      title="User Reports"
      description="Investigate and resolve reports from the community."
      total={reports.length}
      actions={
        <Button variant="outline" onClick={loadReports} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      }
    >
      {isLoading ? (
        <Card className="border-dashed">
          <CardContent className="p-6">
            <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
              <div className="size-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="font-medium">Loading reports...</span>
            </div>
          </CardContent>
        </Card>
      ) : reports.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-12">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="flex items-center justify-center size-16 rounded-full bg-muted/50 mb-4">
                <Flag className="size-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No reports found</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Great job! There are no active reports at this time.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="rounded-md border-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Target</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Reported By</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="text-[10px] h-5 px-1.5 uppercase font-medium"
                        >
                          {report.targetType}
                        </Badge>
                        <span
                          className="truncate max-w-[200px]"
                          title={report.targetContent?.title || report.targetContent?.content}
                        >
                          {report.targetContent?.title ||
                            report.targetContent?.content?.substring(0, 30) + "..."}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{report.reason}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="size-6">
                          <AvatarFallback className="text-xs">
                            {report.reportedBy.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{report.reportedBy.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={report.status === "PENDING" ? "destructive" : "default"}
                        className={cn(
                          report.status === "PENDING" &&
                            "bg-red-100 text-red-700 hover:bg-red-100 border-red-200 font-medium",
                        )}
                      >
                        {report.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {formatDistanceToNow(new Date(report.createdAt))} ago
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => viewDetails(report)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {report.status === "PENDING" && (
                            <DropdownMenuItem onClick={() => handleResolve(report.id)}>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Mark Resolved
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      <Sheet open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Report Details</SheetTitle>
            <SheetDescription>Review the reported content and take action.</SheetDescription>
          </SheetHeader>
          {selectedReport && (
            <div className="grid gap-6 py-6">
              <div className="space-y-4">
                <div className="p-4 bg-muted/40 rounded-lg space-y-2 border border-muted/20">
                  <div className="flex justify-between items-center mb-2">
                    <Badge variant="outline" className="font-medium">
                      {selectedReport.targetType}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      ID: {selectedReport.targetId}
                    </span>
                  </div>
                  {selectedReport.targetContent?.title && (
                    <h4 className="font-semibold">{selectedReport.targetContent.title}</h4>
                  )}
                  <p className="text-sm text-muted-foreground bg-background p-3 rounded border">
                    {selectedReport.targetContent?.content}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Reason</Label>
                    <p className="font-medium text-destructive flex items-center gap-1">
                      <ShieldAlert className="h-4 w-4" />
                      {selectedReport.reason}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Reported By</Label>
                    <div className="flex items-center gap-2">
                      <Avatar className="size-6">
                        <AvatarFallback className="text-xs">
                          {selectedReport.reportedBy.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <p className="font-medium text-sm">{selectedReport.reportedBy.name}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Date</Label>
                    <p className="text-sm">{new Date(selectedReport.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Status</Label>
                    <div className="pt-1">
                      <Badge
                        variant={selectedReport.status === "PENDING" ? "destructive" : "secondary"}
                        className="font-medium"
                      >
                        {selectedReport.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <SheetFooter className="flex-col sm:flex-col gap-2 mt-4">
                {selectedReport.status === "PENDING" ? (
                  <>
                    <Button
                      className="w-full gap-2"
                      onClick={() => {
                        handleResolve(selectedReport.id);
                        setIsDetailsOpen(false);
                      }}
                    >
                      <CheckCircle className="h-4 w-4" />
                      Resolve Report (Ignore)
                    </Button>
                    <Button variant="destructive" className="w-full">
                      Delete Content & Resolve
                    </Button>
                  </>
                ) : (
                  <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
                    Close
                  </Button>
                )}
              </SheetFooter>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </ForumLayout>
  );
}
