import { FileText, CheckCircle, Eye, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import type { FinancialReport } from "@/types/finance";
import { formatDate } from "./helpers";

interface ActivityTabProps {
  report: FinancialReport;
}

export default function ActivityTab({ report }: ActivityTabProps) {
  return (
    <TabsContent value="activity" className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg border">
              <div className="p-2 rounded-full bg-primary/10">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Report generated</p>
                <p className="text-xs text-muted-foreground">
                  {report.generatedBy} created this report on {formatDate(report.generatedAt)}
                </p>
              </div>
            </div>
            {report.reviewedBy && (
              <div className="flex items-center gap-3 p-3 rounded-lg border">
                <div className="p-2 rounded-full bg-blue-100">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Report reviewed</p>
                  <p className="text-xs text-muted-foreground">
                    {report.reviewedBy} reviewed this report on {formatDate(report.reviewedAt!)}
                  </p>
                </div>
              </div>
            )}
            {report.publishedAt && (
              <div className="flex items-center gap-3 p-3 rounded-lg border">
                <div className="p-2 rounded-full bg-green-100">
                  <Eye className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Report published</p>
                  <p className="text-xs text-muted-foreground">
                    Published on {formatDate(report.publishedAt)}
                  </p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 p-3 rounded-lg border">
              <div className="p-2 rounded-full bg-gray-100">
                <Download className="h-4 w-4 text-gray-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Download activity</p>
                <p className="text-xs text-muted-foreground">
                  Downloaded {report.downloadCount} times
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
