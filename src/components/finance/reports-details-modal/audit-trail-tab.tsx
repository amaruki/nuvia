import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AuditTrailData } from "@/types/finance";
import { formatDate } from "./helpers";

interface AuditTrailTabProps {
  auditTrailData?: AuditTrailData | null;
}

export default function AuditTrailTab({ auditTrailData }: AuditTrailTabProps) {
  if (!auditTrailData) return null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Audit Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Audit Period</span>
              <span className="font-medium">
                {formatDate(auditTrailData.auditPeriod.startDate)} -{" "}
                {formatDate(auditTrailData.auditPeriod.endDate)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Audited By</span>
              <span className="font-medium">{auditTrailData.auditedBy}</span>
            </div>
            <div className="flex justify-between">
              <span>Audit Type</span>
              <span className="font-medium capitalize">{auditTrailData.auditType}</span>
            </div>
            <div className="flex justify-between">
              <span>Status</span>
              <Badge
                variant={
                  auditTrailData.status === "completed"
                    ? "default"
                    : auditTrailData.status === "in_progress"
                      ? "secondary"
                      : "destructive"
                }
              >
                {auditTrailData.status.replace("_", " ")}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Compliance Score</span>
              <span className="font-medium">{auditTrailData.complianceScore}%</span>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Risk Assessment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Overall Risk</span>
              <Badge
                variant={
                  auditTrailData.riskAssessment.overall === "low"
                    ? "default"
                    : auditTrailData.riskAssessment.overall === "medium"
                      ? "secondary"
                      : "destructive"
                }
              >
                {auditTrailData.riskAssessment.overall}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Financial Risk</span>
              <Badge
                variant={
                  auditTrailData.riskAssessment.financial === "low"
                    ? "default"
                    : auditTrailData.riskAssessment.financial === "medium"
                      ? "secondary"
                      : "destructive"
                }
              >
                {auditTrailData.riskAssessment.financial}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Operational Risk</span>
              <Badge
                variant={
                  auditTrailData.riskAssessment.operational === "low"
                    ? "default"
                    : auditTrailData.riskAssessment.operational === "medium"
                      ? "secondary"
                      : "destructive"
                }
              >
                {auditTrailData.riskAssessment.operational}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Compliance Risk</span>
              <Badge
                variant={
                  auditTrailData.riskAssessment.compliance === "low"
                    ? "default"
                    : auditTrailData.riskAssessment.compliance === "medium"
                      ? "secondary"
                      : "destructive"
                }
              >
                {auditTrailData.riskAssessment.compliance}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Findings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {auditTrailData.findings.map((finding) => (
              <div key={finding.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{finding.category}</h4>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        finding.severity === "low"
                          ? "secondary"
                          : finding.severity === "medium"
                            ? "outline"
                            : finding.severity === "high"
                              ? "destructive"
                              : "destructive"
                      }
                    >
                      {finding.severity}
                    </Badge>
                    <Badge
                      variant={
                        finding.status === "resolved"
                          ? "default"
                          : finding.status === "in_progress"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {finding.status.replace("_", " ")}
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{finding.description}</p>
                <p className="text-sm font-medium">Recommendation: {finding.recommendation}</p>
                {finding.resolvedAt && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Resolved on {formatDate(finding.resolvedAt)}
                  </p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
