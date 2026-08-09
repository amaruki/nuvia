import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { FinancialReport } from "@/types/finance";

interface ReportHeaderCardProps {
  report: FinancialReport;
}

export function ReportHeaderCard({ report }: ReportHeaderCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{report.type.replace("_", " ")}</Badge>
          <Badge variant="secondary">{report.period}</Badge>
          <Badge variant="default">{report.status}</Badge>
        </div>
        <CardTitle className="text-base sm:text-lg">{report.title}</CardTitle>
        <CardDescription className="text-sm">{report.description}</CardDescription>
        <p className="text-xs text-muted-foreground">
          Generated {new Date(report.generatedAt).toLocaleString()} by {report.generatedBy}
        </p>
      </CardHeader>
    </Card>
  );
}
