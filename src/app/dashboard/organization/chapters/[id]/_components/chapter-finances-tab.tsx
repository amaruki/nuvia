import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TabsContent } from "@/components/ui/tabs";
import type { Chapter } from "@/types/chapter.types";
import { formatCurrency, formatPercentage } from "./chapter-helpers";

interface ChapterFinancesTabProps {
  chapter: Chapter;
}

export function ChapterFinancesTab({ chapter }: ChapterFinancesTabProps) {
  return (
    <TabsContent value="finances" className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Financial Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Financial Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total Revenue</span>
              <span className="text-sm font-bold">
                {formatCurrency(chapter.finances.totalRevenue)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total Expenses</span>
              <span className="text-sm font-bold">
                {formatCurrency(chapter.finances.totalExpenses)}
              </span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Net Income</span>
              <span
                className={`text-sm font-bold ${chapter.finances.netIncome >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"}`}
              >
                {formatCurrency(chapter.finances.netIncome)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Budget</span>
              <span className="text-sm font-bold">{formatCurrency(chapter.finances.budget)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Budget Utilization</span>
              <span className="text-sm font-bold">
                {formatPercentage(chapter.finances.budgetUtilization)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Chapter Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Membership Dues</span>
              <span className="text-sm font-bold">
                {formatCurrency(chapter.settings.membershipDues)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Meeting Frequency</span>
              <Badge variant="outline" className="capitalize">
                {chapter.settings.meetingFrequency}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Online Registration</span>
              <Badge variant={chapter.settings.allowOnlineRegistration ? "default" : "secondary"}>
                {chapter.settings.allowOnlineRegistration ? "Enabled" : "Disabled"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Require Approval</span>
              <Badge variant={chapter.settings.requireApproval ? "default" : "secondary"}>
                {chapter.settings.requireApproval ? "Required" : "Not Required"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Auto-Renew Membership</span>
              <Badge variant={chapter.settings.autoRenewMembership ? "default" : "secondary"}>
                {chapter.settings.autoRenewMembership ? "Enabled" : "Disabled"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </TabsContent>
  );
}
