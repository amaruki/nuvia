import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { IncomeStatementData } from "@/types/finance";
import { formatCurrency } from "./helpers";

interface IncomeStatementTabProps {
  incomeStatementData?: IncomeStatementData | null;
}

export default function IncomeStatementTab({ incomeStatementData }: IncomeStatementTabProps) {
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
              <span className="font-medium">{formatCurrency(incomeStatementData.grossProfit)}</span>
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
}
