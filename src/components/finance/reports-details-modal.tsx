"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Download,
  Calendar,
  User,
  FileText,
  BarChart3,
  PieChart,
  DollarSign,
  TrendingUp,
  Shield,
  Eye,
  Edit,
  Share2,
  Tag,
  Clock,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import {
  FinancialReport,
  IncomeStatementData,
  BalanceSheetData,
  CashFlowData,
  BudgetVsActualData,
  TaxDocumentData,
  AuditTrailData,
} from "@/types/finance.types";
import { cn } from "@/lib/utils";

interface ReportsDetailsModalProps {
  report: FinancialReport | null;
  incomeStatementData?: IncomeStatementData | null;
  balanceSheetData?: BalanceSheetData | null;
  cashFlowData?: CashFlowData | null;
  budgetVsActualData?: BudgetVsActualData | null;
  taxDocumentData?: TaxDocumentData | null;
  auditTrailData?: AuditTrailData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDownload: (report: FinancialReport) => void;
  onEdit: (report: FinancialReport) => void;
  onShare: (report: FinancialReport) => void;
  onUpdateStatus: (report: FinancialReport, status: FinancialReport["status"]) => void;
}

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "N/A";
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
  };

  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case "income_statement":
        return <BarChart3 className="h-5 w-5" />;
      case "balance_sheet":
        return <PieChart className="h-5 w-5" />;
      case "cash_flow":
        return <DollarSign className="h-5 w-5" />;
      case "budget_vs_actual":
        return <TrendingUp className="h-5 w-5" />;
      case "tax_document":
        return <FileText className="h-5 w-5" />;
      case "audit_trail":
        return <Shield className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const getStatusBadge = (status: FinancialReport["status"]) => {
    switch (status) {
      case "draft":
        return <Badge variant="secondary">Draft</Badge>;
      case "pending_review":
        return (
          <Badge variant="outline" className="border-yellow-500 text-yellow-600">
            Pending Review
          </Badge>
        );
      case "approved":
        return (
          <Badge variant="outline" className="border-blue-500 text-blue-600">
            Approved
          </Badge>
        );
      case "published":
        return <Badge variant="default">Published</Badge>;
      case "archived":
        return <Badge variant="outline">Archived</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const renderIncomeStatement = () => {
    if (!incomeStatementData) return null;

    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Total Revenue</span>
                  <span className="font-medium">
                    {formatCurrency(incomeStatementData.revenue.totalRevenue)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Operating Revenue</span>
                  <span>{formatCurrency(incomeStatementData.revenue.operatingRevenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Non-Operating Revenue</span>
                  <span>{formatCurrency(incomeStatementData.revenue.nonOperatingRevenue)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Total Expenses</span>
                  <span className="font-medium">
                    {formatCurrency(incomeStatementData.expenses.totalExpenses)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Operating Expenses</span>
                  <span>{formatCurrency(incomeStatementData.expenses.operatingExpenses)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Non-Operating Expenses</span>
                  <span>{formatCurrency(incomeStatementData.expenses.nonOperatingExpenses)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Gross Profit</span>
                <span className="font-medium">
                  {formatCurrency(incomeStatementData.grossProfit)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Operating Income</span>
                <span className="font-medium">
                  {formatCurrency(incomeStatementData.operatingIncome)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>EBITDA</span>
                <span className="font-medium">{formatCurrency(incomeStatementData.ebitda)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>Net Income</span>
                <span>{formatCurrency(incomeStatementData.netIncome)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderBalanceSheet = () => {
    if (!balanceSheetData) return null;

    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Assets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Total Assets</span>
                  <span className="font-medium">
                    {formatCurrency(balanceSheetData.assets.totalAssets)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Current Assets</span>
                  <span>{formatCurrency(balanceSheetData.assets.currentAssets)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Non-Current Assets</span>
                  <span>{formatCurrency(balanceSheetData.assets.nonCurrentAssets)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Liabilities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Total Liabilities</span>
                  <span className="font-medium">
                    {formatCurrency(balanceSheetData.liabilities.totalLiabilities)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Current Liabilities</span>
                  <span>{formatCurrency(balanceSheetData.liabilities.currentLiabilities)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Non-Current Liabilities</span>
                  <span>{formatCurrency(balanceSheetData.liabilities.nonCurrentLiabilities)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Equity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Total Equity</span>
                  <span className="font-medium">
                    {formatCurrency(balanceSheetData.equity.totalEquity)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const renderCashFlow = () => {
    if (!cashFlowData) return null;

    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Operating Activities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Net Income</span>
                  <span>{formatCurrency(cashFlowData.operatingActivities.netIncome)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Adjustments</span>
                  <span>{formatCurrency(cashFlowData.operatingActivities.adjustments)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Changes in Working Capital</span>
                  <span>
                    {formatCurrency(cashFlowData.operatingActivities.changesInWorkingCapital)}
                  </span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Net Cash from Operations</span>
                  <span>
                    {formatCurrency(cashFlowData.operatingActivities.netCashFromOperations)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Investing Activities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Capital Expenditures</span>
                  <span>
                    {formatCurrency(cashFlowData.investingActivities.capitalExpenditures)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Investments</span>
                  <span>{formatCurrency(cashFlowData.investingActivities.investments)}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Net Cash from Investing</span>
                  <span>
                    {formatCurrency(cashFlowData.investingActivities.netCashFromInvesting)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Financing Activities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Debt Issuance</span>
                  <span>{formatCurrency(cashFlowData.financingActivities.debtIssuance)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Debt Repayment</span>
                  <span>{formatCurrency(cashFlowData.financingActivities.debtRepayment)}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Net Cash from Financing</span>
                  <span>
                    {formatCurrency(cashFlowData.financingActivities.netCashFromFinancing)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Net Change in Cash</span>
                <span className="font-medium">{formatCurrency(cashFlowData.netChangeInCash)}</span>
              </div>
              <div className="flex justify-between">
                <span>Cash at Beginning</span>
                <span>{formatCurrency(cashFlowData.cashAtBeginning)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>Cash at End</span>
                <span>{formatCurrency(cashFlowData.cashAtEnd)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderBudgetVsActual = () => {
    if (!budgetVsActualData) return null;

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Budget vs Actual Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Total Budgeted</span>
                <span className="font-medium">
                  {formatCurrency(budgetVsActualData.totalBudgeted)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Total Actual</span>
                <span className="font-medium">
                  {formatCurrency(budgetVsActualData.totalActual)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Total Variance</span>
                <span
                  className={cn(
                    "font-medium",
                    budgetVsActualData.totalVariance >= 0 ? "text-green-600" : "text-red-600",
                  )}
                >
                  {formatCurrency(budgetVsActualData.totalVariance)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Variance Percentage</span>
                <span
                  className={cn(
                    "font-medium",
                    budgetVsActualData.totalVariancePercentage >= 0
                      ? "text-green-600"
                      : "text-red-600",
                  )}
                >
                  {budgetVsActualData.totalVariancePercentage.toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="grid gap-4 md:grid-cols-2">
          {budgetVsActualData.categories.map((category) => (
            <Card key={category.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{category.name}</CardTitle>
                  <Badge
                    variant={
                      category.status === "under_budget"
                        ? "default"
                        : category.status === "on_track"
                          ? "secondary"
                          : "destructive"
                    }
                  >
                    {category.status.replace("_", " ")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Budgeted</span>
                    <span>{formatCurrency(category.budgeted)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Actual</span>
                    <span>{formatCurrency(category.actual)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Variance</span>
                    <span
                      className={cn(
                        "font-medium",
                        category.variance >= 0 ? "text-green-600" : "text-red-600",
                      )}
                    >
                      {formatCurrency(category.variance)}
                    </span>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progress</span>
                      <span>{Math.abs(category.variancePercentage).toFixed(1)}%</span>
                    </div>
                    <Progress
                      value={Math.min(Math.abs(category.variancePercentage), 100)}
                      className="h-2"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  const renderTaxDocument = () => {
    if (!taxDocumentData) return null;

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tax Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Tax Year</span>
                <span className="font-medium">{taxDocumentData.taxYear}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax Type</span>
                <span className="font-medium capitalize">
                  {taxDocumentData.taxType.replace("_", " ")}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Total Taxable Income</span>
                <span className="font-medium">
                  {formatCurrency(taxDocumentData.totalTaxableIncome)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Total Tax</span>
                <span className="font-medium">{formatCurrency(taxDocumentData.totalTax)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax Paid</span>
                <span>{formatCurrency(taxDocumentData.taxPaid)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>Tax Due</span>
                <span className={taxDocumentData.taxDue > 0 ? "text-red-600" : "text-green-600"}>
                  {formatCurrency(taxDocumentData.taxDue)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Deductions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {taxDocumentData.deductions.map((deduction, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between">
                      <span className="font-medium">{deduction.category}</span>
                      <span>{formatCurrency(deduction.amount)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{deduction.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Credits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {taxDocumentData.credits.map((credit, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between">
                      <span className="font-medium">{credit.category}</span>
                      <span>{formatCurrency(credit.amount)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{credit.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const renderAuditTrail = () => {
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
  };

  const renderReportContent = () => {
    switch (report.type) {
      case "income_statement":
        return renderIncomeStatement();
      case "balance_sheet":
        return renderBalanceSheet();
      case "cash_flow":
        return renderCashFlow();
      case "budget_vs_actual":
        return renderBudgetVsActual();
      case "tax_document":
        return renderTaxDocument();
      case "audit_trail":
        return renderAuditTrail();
      default:
        return (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Report content not available</p>
              </div>
            </CardContent>
          </Card>
        );
    }
  };

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

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Report Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Period: {report.period}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {formatDate(report.startDate)} - {formatDate(report.endDate)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Generated by: {report.generatedBy}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Generated: {formatDate(report.generatedAt)}</span>
                    </div>
                    {report.reviewedBy && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Reviewed by: {report.reviewedBy}</span>
                      </div>
                    )}
                    {report.publishedAt && (
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Published: {formatDate(report.publishedAt)}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">File Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">File Size: {formatFileSize(report.fileSize)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Download className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Downloads: {report.downloadCount}</span>
                    </div>
                    {report.fileUrl && (
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">File Available</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
            {report.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{report.notes}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="content" className="space-y-6">
            {renderReportContent()}
          </TabsContent>

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
                          {report.reviewedBy} reviewed this report on{" "}
                          {formatDate(report.reviewedAt!)}
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
        </Tabs>

        <div className="flex justify-between pt-4 border-t">
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onEdit(report)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button variant="outline" onClick={() => onShare(report)}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button onClick={() => onDownload(report)}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
