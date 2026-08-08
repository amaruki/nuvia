import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TaxDocumentData } from "@/types/finance";
import { formatCurrency } from "./helpers";

interface TaxDocumentTabProps {
  taxDocumentData?: TaxDocumentData | null;
}

export default function TaxDocumentTab({ taxDocumentData }: TaxDocumentTabProps) {
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
}
