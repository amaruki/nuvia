import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CashFlowData } from "@/types/finance";
import { formatCurrency } from "./helpers";

interface CashFlowTabProps {
  cashFlowData?: CashFlowData | null;
}

export default function CashFlowTab({ cashFlowData }: CashFlowTabProps) {
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
                <span>{formatCurrency(cashFlowData.investingActivities.capitalExpenditures)}</span>
              </div>
              <div className="flex justify-between">
                <span>Investments</span>
                <span>{formatCurrency(cashFlowData.investingActivities.investments)}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Net Cash from Investing</span>
                <span>{formatCurrency(cashFlowData.investingActivities.netCashFromInvesting)}</span>
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
                <span>{formatCurrency(cashFlowData.financingActivities.netCashFromFinancing)}</span>
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
}
