import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BalanceSheetData } from "@/types/finance";
import { formatCurrency } from "./helpers";

interface BalanceSheetTabProps {
  balanceSheetData?: BalanceSheetData | null;
}

export default function BalanceSheetTab({ balanceSheetData }: BalanceSheetTabProps) {
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
}
