import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { FinancialReport } from "@/types/finance";

interface RecentReportsCardProps {
  reports: FinancialReport[];
  onViewDetails: (report: FinancialReport) => void;
}

export function RecentReportsCard({ reports, onViewDetails }: RecentReportsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base sm:text-lg">Computed Reports</CardTitle>
        <CardDescription className="text-sm">
          Live aggregates from the membership ledger
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {reports.slice(0, 5).map((report) => (
            <div
              key={report.id}
              className="flex items-center justify-between cursor-pointer hover:bg-muted/50 p-2 rounded"
              role="button"
              tabIndex={0}
              aria-label={`View details for ${report.title}`}
              onClick={() => onViewDetails(report)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onViewDetails(report);
                }
              }}
            >
              <div className="min-w-0 flex-1 mr-2">
                <p className="text-sm font-medium truncate">{report.title}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {report.type.replace("_", " ")} • {report.period}
                </p>
              </div>
              <div className="text-right shrink-0">
                <Badge
                  variant={
                    report.status === "published"
                      ? "default"
                      : report.status === "pending_review"
                        ? "secondary"
                        : "outline"
                  }
                  className="text-xs"
                >
                  {report.status.replace("_", " ")}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
