"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ReportsDetailsModalProps } from "./types";
import getReportTypeIcon from "./report-type-icon";
import getStatusBadge from "./status-badge";
import OverviewTab from "./overview-tab";
import ReportContent from "./report-content";
import ActivityTab from "./activity-tab";
import ModalFooter from "./modal-footer";

export function ReportsDetailsModal({
  report,
  incomeStatementData,
  balanceSheetData,
  cashFlowData,
  budgetVsActualData,
  taxDocumentData,
  auditTrailData,
  open,
  onOpenChange,
  onDownload,
  onEdit,
  onShare,
  onUpdateStatus,
}: ReportsDetailsModalProps) {
  const [activeTab, setActiveTab] = useState("overview");

  if (!report) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-primary/10">{getReportTypeIcon(report.type)}</div>
              <div>
                <DialogTitle className="text-xl">{report.title}</DialogTitle>
                <DialogDescription className="mt-1">{report.description}</DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">{getStatusBadge(report.status)}</div>
          </div>
        </DialogHeader>

        <div className="flex flex-wrap gap-2 mb-4">
          {report.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <OverviewTab report={report} />

          <TabsContent value="content" className="space-y-6">
            <ReportContent
              report={report}
              incomeStatementData={incomeStatementData}
              balanceSheetData={balanceSheetData}
              cashFlowData={cashFlowData}
              budgetVsActualData={budgetVsActualData}
              taxDocumentData={taxDocumentData}
              auditTrailData={auditTrailData}
            />
          </TabsContent>

          <ActivityTab report={report} />
        </Tabs>

        <ModalFooter
          report={report}
          onOpenChange={onOpenChange}
          onDownload={onDownload}
          onEdit={onEdit}
          onShare={onShare}
        />
      </DialogContent>
    </Dialog>
  );
}

export default ReportsDetailsModal;
