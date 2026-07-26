"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
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
  ArrowLeft,
  AlertCircle,
  TrendingDown,
  ArrowUp,
  ArrowDown,
  FileDown,
  Users,
  Activity,
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
import { useReports } from "@/lib/hooks/use-reports";
import { useHeader } from "@/contexts/dashboard-context";
import { cn } from "@/lib/utils";

export default function ReportDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const reportId = params.id as string;
  const [activeTab, setActiveTab] = useState("overview");
  const { setHeader, clearHeader } = useHeader();

  const {
    getReportById,
    incomeStatementData,
    balanceSheetData,
    cashFlowData,
    budgetVsActualData,
    taxDocumentData,
    auditTrailData,
    downloadReport,
    updateReportStatus,
  } = useReports();

  const report = getReportById(reportId);

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

  const handleDownload = () => {
    if (report) {
      downloadReport(report.id);
    }
  };

  const handleEdit = () => {
    if (report) {
      // TODO: Implement edit functionality
      console.log("Edit report:", report);
    }
  };

  const handleShare = () => {
    if (report) {
      // TODO: Implement share functionality
      console.log("Share report:", report);
    }
  };

  const handleUpdateStatus = (status: FinancialReport["status"]) => {
    if (report) {
      updateReportStatus(report.id, status);
    }
  };

  const renderIncomeStatement = () => {
    if (!incomeStatementData) return null;

    return (
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Revenue</CardTitle>
              <CardDescription>Income sources and breakdown</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-sm font-medium">Total Revenue</span>
                <span className="text-lg font-bold text-green-600">
                  {formatCurrency(incomeStatementData.revenue.totalRevenue)}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Operating Revenue</span>
                  <span>{formatCurrency(incomeStatementData.revenue.operatingRevenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Non-Operating Revenue</span>
                  <span>{formatCurrency(incomeStatementData.revenue.nonOperatingRevenue)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Expenses</CardTitle>
              <CardDescription>Cost breakdown and analysis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-sm font-medium">Total Expenses</span>
                <span className="text-lg font-bold text-red-600">
                  {formatCurrency(incomeStatementData.expenses.totalExpenses)}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Operating Expenses</span>
                  <span>{formatCurrency(incomeStatementData.expenses.operatingExpenses)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Non-Operating Expenses</span>
                  <span>{formatCurrency(incomeStatementData.expenses.nonOperatingExpenses)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Financial Summary</CardTitle>
            <CardDescription>Key performance indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Gross Profit</span>
                  <span className="font-semibold">
                    {formatCurrency(incomeStatementData.grossProfit)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Operating Income</span>
                  <span className="font-semibold">
                    {formatCurrency(incomeStatementData.operatingIncome)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">EBITDA</span>
                  <span className="font-semibold">
                    {formatCurrency(incomeStatementData.ebitda)}
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-sm font-medium">Net Income</span>
                  <span className="text-xl font-bold text-green-600">
                    {formatCurrency(incomeStatementData.netIncome)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">vs Previous Period</span>
                  {incomeStatementData.periodComparison.change >= 0 ? (
                    <ArrowUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <ArrowDown className="h-4 w-4 text-red-600" />
                  )}
                  <span
                    className={cn(
                      "font-semibold",
                      incomeStatementData.periodComparison.change >= 0
                        ? "text-green-600"
                        : "text-red-600",
                    )}
                  >
                    {formatCurrency(incomeStatementData.periodComparison.change)} (
                    {incomeStatementData.periodComparison.changePercentage.toFixed(1)}%)
                  </span>
                </div>
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
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Assets</CardTitle>
              <CardDescription>What the company owns</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-sm font-medium">Total Assets</span>
                <span className="text-lg font-bold">
                  {formatCurrency(balanceSheetData.assets.totalAssets)}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Current Assets</span>
                  <span>{formatCurrency(balanceSheetData.assets.currentAssets)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Non-Current Assets</span>
                  <span>{formatCurrency(balanceSheetData.assets.nonCurrentAssets)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Liabilities</CardTitle>
              <CardDescription>What the company owes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-sm font-medium">Total Liabilities</span>
                <span className="text-lg font-bold">
                  {formatCurrency(balanceSheetData.liabilities.totalLiabilities)}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Current Liabilities</span>
                  <span>{formatCurrency(balanceSheetData.liabilities.currentLiabilities)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Non-Current Liabilities</span>
                  <span>{formatCurrency(balanceSheetData.liabilities.nonCurrentLiabilities)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Equity</CardTitle>
              <CardDescription>Owner's stake in the company</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-sm font-medium">Total Equity</span>
                <span className="text-lg font-bold">
                  {formatCurrency(balanceSheetData.equity.totalEquity)}
                </span>
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
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Operating Activities</CardTitle>
              <CardDescription>Cash from core business operations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Net Income</span>
                  <span>{formatCurrency(cashFlowData.operatingActivities.netIncome)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Adjustments</span>
                  <span>{formatCurrency(cashFlowData.operatingActivities.adjustments)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Working Capital Changes</span>
                  <span>
                    {formatCurrency(cashFlowData.operatingActivities.changesInWorkingCapital)}
                  </span>
                </div>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Net Cash from Operations</span>
                <span className="font-bold text-green-600">
                  {formatCurrency(cashFlowData.operatingActivities.netCashFromOperations)}
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Investing Activities</CardTitle>
              <CardDescription>Cash from investments and assets</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Capital Expenditures</span>
                  <span className="text-red-600">
                    {formatCurrency(cashFlowData.investingActivities.capitalExpenditures)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Investments</span>
                  <span className="text-red-600">
                    {formatCurrency(cashFlowData.investingActivities.investments)}
                  </span>
                </div>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Net Cash from Investing</span>
                <span className="font-bold text-red-600">
                  {formatCurrency(cashFlowData.investingActivities.netCashFromInvesting)}
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Financing Activities</CardTitle>
              <CardDescription>Cash from financing and capital</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Debt Issuance</span>
                  <span className="text-green-600">
                    {formatCurrency(cashFlowData.financingActivities.debtIssuance)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Debt Repayment</span>
                  <span className="text-red-600">
                    {formatCurrency(cashFlowData.financingActivities.debtRepayment)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Equity Issuance</span>
                  <span className="text-green-600">
                    {formatCurrency(cashFlowData.financingActivities.equityIssuance)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Dividends Paid</span>
                  <span className="text-red-600">
                    {formatCurrency(cashFlowData.financingActivities.dividendsPaid)}
                  </span>
                </div>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Net Cash from Financing</span>
                <span className="font-bold text-green-600">
                  {formatCurrency(cashFlowData.financingActivities.netCashFromFinancing)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Cash Flow Summary</CardTitle>
            <CardDescription>Overall cash position changes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Net Change in Cash</span>
                    <span className="font-semibold">
                      {formatCurrency(cashFlowData.netChangeInCash)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Cash at Beginning</span>
                    <span>{formatCurrency(cashFlowData.cashAtBeginning)}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Cash at End</span>
                    <span className="text-xl font-bold text-green-600">
                      {formatCurrency(cashFlowData.cashAtEnd)}
                    </span>
                  </div>
                </div>
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
            <CardTitle>Budget vs Actual Summary</CardTitle>
            <CardDescription>Overall budget performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Budgeted</span>
                  <span className="text-lg font-bold">
                    {formatCurrency(budgetVsActualData.totalBudgeted)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Actual</span>
                  <span className="text-lg font-bold">
                    {formatCurrency(budgetVsActualData.totalActual)}
                  </span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Variance</span>
                  <span
                    className={cn(
                      "text-xl font-bold",
                      budgetVsActualData.totalVariance >= 0 ? "text-green-600" : "text-red-600",
                    )}
                  >
                    {formatCurrency(budgetVsActualData.totalVariance)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Variance Percentage</span>
                  <span
                    className={cn(
                      "font-semibold",
                      budgetVsActualData.totalVariancePercentage >= 0
                        ? "text-green-600"
                        : "text-red-600",
                    )}
                  >
                    {budgetVsActualData.totalVariancePercentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="grid gap-6 md:grid-cols-2">
          {budgetVsActualData.categories.map((category) => (
            <Card key={category.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{category.name}</CardTitle>
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
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Budgeted</span>
                    <span>{formatCurrency(category.budgeted)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Actual</span>
                    <span>{formatCurrency(category.actual)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Variance</span>
                    <span
                      className={cn(
                        "font-semibold",
                        category.variance >= 0 ? "text-green-600" : "text-red-600",
                      )}
                    >
                      {formatCurrency(category.variance)}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Variance</span>
                    <span>{Math.abs(category.variancePercentage).toFixed(1)}%</span>
                  </div>
                  <Progress
                    value={Math.min(Math.abs(category.variancePercentage), 100)}
                    className="h-2"
                  />
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
            <CardTitle>Tax Summary</CardTitle>
            <CardDescription>Tax calculation and filing information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Tax Year</span>
                  <span className="font-semibold">{taxDocumentData.taxYear}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Tax Type</span>
                  <span className="font-semibold capitalize">
                    {taxDocumentData.taxType.replace("_", " ")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Filing Status</span>
                  <span className="font-semibold">
                    {taxDocumentData.filedAt
                      ? `Filed on ${formatDate(taxDocumentData.filedAt)}`
                      : "Not Filed"}
                  </span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Taxable Income</span>
                  <span className="font-semibold">
                    {formatCurrency(taxDocumentData.totalTaxableIncome)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Tax</span>
                  <span className="font-semibold">{formatCurrency(taxDocumentData.totalTax)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Tax Paid</span>
                  <span className="font-semibold">{formatCurrency(taxDocumentData.taxPaid)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Tax Due</span>
                  <span
                    className={cn(
                      "text-xl font-bold",
                      taxDocumentData.taxDue > 0 ? "text-red-600" : "text-green-600",
                    )}
                  >
                    {formatCurrency(taxDocumentData.taxDue)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Deductions</CardTitle>
              <CardDescription>Tax deductions and credits</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {taxDocumentData.deductions.map((deduction, index) => (
                  <div key={index} className="border-b pb-3 last:border-b-0">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">{deduction.category}</span>
                      <span className="font-semibold">{formatCurrency(deduction.amount)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{deduction.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Tax Credits</CardTitle>
              <CardDescription>Available tax credits</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {taxDocumentData.credits.map((credit, index) => (
                  <div key={index} className="border-b pb-3 last:border-b-0">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">{credit.category}</span>
                      <span className="font-semibold">{formatCurrency(credit.amount)}</span>
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
            <CardTitle>Audit Summary</CardTitle>
            <CardDescription>Audit findings and compliance status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Audit Period</span>
                  <span className="font-semibold">
                    {formatDate(auditTrailData.auditPeriod.startDate)} -{" "}
                    {formatDate(auditTrailData.auditPeriod.endDate)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Audited By</span>
                  <span className="font-semibold">{auditTrailData.auditedBy}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Audit Type</span>
                  <span className="font-semibold capitalize">{auditTrailData.auditType}</span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Compliance Score</span>
                  <span className="text-2xl font-bold">{auditTrailData.complianceScore}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
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
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Risk Assessment</CardTitle>
            <CardDescription>Risk levels and categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {[
                { label: "Overall Risk", value: auditTrailData.riskAssessment.overall },
                { label: "Financial Risk", value: auditTrailData.riskAssessment.financial },
                { label: "Operational Risk", value: auditTrailData.riskAssessment.operational },
                { label: "Compliance Risk", value: auditTrailData.riskAssessment.compliance },
              ].map((risk) => (
                <div
                  key={risk.label}
                  className="flex justify-between items-center p-3 border rounded-lg"
                >
                  <span className="text-sm font-medium">{risk.label}</span>
                  <Badge
                    variant={
                      risk.value === "low"
                        ? "default"
                        : risk.value === "medium"
                          ? "secondary"
                          : "destructive"
                    }
                  >
                    {risk.value}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Audit Findings</CardTitle>
            <CardDescription>Issues and recommendations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {auditTrailData.findings.map((finding) => (
                <div key={finding.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">{finding.category}</h4>
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
    switch (report?.type) {
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

  useEffect(() => {
    if (report) {
      setHeader({
        title: report.title,
        description: report.description,
      });
    }

    return () => {
      clearHeader();
    };
  }, [report, setHeader, clearHeader]);

  if (!report) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Report not found</p>
          <Button className="mt-4" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Reports
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleEdit}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button variant="outline" onClick={handleShare}>
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
              <Button onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Report Header */}
      <div className="container mx-auto px-4 py-6">
        <div className="mb-8">
          {/* Report Information Cards */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Status & Type Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Report Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status</span>
                  {getStatusBadge(report.status)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Type</span>
                  <span className="text-sm capitalize">{report.type.replace("_", " ")}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Downloads</span>
                  <span className="text-sm">{report.downloadCount}</span>
                </div>
                {report.fileSize && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">File Size</span>
                    <span className="text-sm">{formatFileSize(report.fileSize)}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Period & Dates Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Period & Dates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Period</p>
                  <p className="text-sm text-muted-foreground">{report.period}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Date Range</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(report.startDate)} - {formatDate(report.endDate)}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Generated</p>
                  <p className="text-sm text-muted-foreground">{formatDate(report.generatedAt)}</p>
                </div>
                {report.publishedAt && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Published</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(report.publishedAt)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* People Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">People</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Generated by</p>
                  <p className="text-sm text-muted-foreground">{report.generatedBy}</p>
                </div>
                {report.reviewedBy && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Reviewed by</p>
                    <p className="text-sm text-muted-foreground">{report.reviewedBy}</p>
                  </div>
                )}
                {report.reviewedAt && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Reviewed on</p>
                    <p className="text-sm text-muted-foreground">{formatDate(report.reviewedAt)}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Notes Card */}
          {report.notes && (
            <Card className="mt-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{report.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Report Overview</CardTitle>
                <CardDescription>Summary and key information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Report Details</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Report Type</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {report.type.replace("_", " ")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Period</p>
                          <p className="text-xs text-muted-foreground">{report.period}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Generated by</p>
                          <p className="text-xs text-muted-foreground">{report.generatedBy}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Status Information</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Badge className="mr-2">{getStatusBadge(report.status)}</Badge>
                        <span className="text-sm font-medium capitalize">
                          {report.status.replace("_", " ")}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Generated</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(report.generatedAt)}
                          </p>
                        </div>
                      </div>
                      {report.reviewedBy && (
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Reviewed</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(report.reviewedAt!)}
                            </p>
                          </div>
                        </div>
                      )}
                      {report.publishedAt && (
                        <div className="flex items-center gap-3">
                          <Eye className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Published</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(report.publishedAt)}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="bg-muted/30 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Usage Guidelines</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    This financial report provides comprehensive insights into the organization's
                    financial performance and position during the specified period. The report has
                    been carefully prepared following standard accounting principles and internal
                    controls.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mt-3">
                    This report is intended for internal management review, board presentation, and
                    compliance purposes. It should be used in conjunction with other financial
                    documents for complete financial analysis.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content" className="space-y-6 mt-6">
            {renderReportContent()}
          </TabsContent>

          <TabsContent value="activity" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Report actions and timeline</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="p-2 rounded-full bg-primary/10">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Report Generated</p>
                      <p className="text-xs text-muted-foreground">
                        {report.generatedBy} created this report on {formatDate(report.generatedAt)}
                      </p>
                    </div>
                  </div>
                  {report.reviewedBy && (
                    <div className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="p-2 rounded-full bg-blue-100">
                        <CheckCircle className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Report Reviewed</p>
                        <p className="text-xs text-muted-foreground">
                          {report.reviewedBy} reviewed this report on{" "}
                          {formatDate(report.reviewedAt!)}
                        </p>
                      </div>
                    </div>
                  )}
                  {report.publishedAt && (
                    <div className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="p-2 rounded-full bg-green-100">
                        <Eye className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Report Published</p>
                        <p className="text-xs text-muted-foreground">
                          Published on {formatDate(report.publishedAt)}
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="p-2 rounded-full bg-gray-100">
                      <Download className="h-5 w-5 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Download Activity</p>
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
      </div>
    </div>
  );
}
