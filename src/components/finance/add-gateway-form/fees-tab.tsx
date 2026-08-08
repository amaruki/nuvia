import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TabsContent } from "@/components/ui/tabs";
import { TransactionFee } from "@/types/finance";
import { Plus, Trash2, CreditCard } from "lucide-react";
import { PAYMENT_METHOD_OPTIONS } from "./options";

interface FeesTabProps {
  fees: Partial<TransactionFee>[];
  addFee: () => void;
  removeFee: (index: number) => void;
  updateFee: <K extends keyof TransactionFee>(
    index: number,
    field: K,
    value: TransactionFee[K],
  ) => void;
}

export function FeesTab({ fees, addFee, removeFee, updateFee }: FeesTabProps) {
  return (
    <TabsContent value="fees" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Transaction Fees</h3>
          <p className="text-sm text-muted-foreground">
            Configure fees for different payment methods
          </p>
        </div>
        <Button type="button" variant="outline" onClick={addFee}>
          <Plus className="mr-2 h-4 w-4" />
          Add Fee
        </Button>
      </div>

      <div className="space-y-4">
        {fees.map((fee, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium">{fee.name || "New Fee"}</h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFee(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Fee Name</Label>
                  <Input
                    value={fee.name || ""}
                    onChange={(e) => updateFee(index, "name", e.target.value)}
                    placeholder="e.g., Standard Card Fee"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Fee Type</Label>
                  <Select
                    value={fee.type || "fixed"}
                    onValueChange={(value) => {
                      // Radix Select reports string; the options above restrict it to fee types.
                      const feeType = value as TransactionFee["type"];
                      updateFee(index, "type", feeType);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="mixed">Mixed (Fixed + %)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {(fee.type === "percentage" || fee.type === "mixed") && (
                <div className="space-y-2">
                  <Label>Percentage (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={fee.percentage || ""}
                    onChange={(e) => updateFee(index, "percentage", parseFloat(e.target.value))}
                    placeholder="2.9"
                  />
                </div>
              )}

              {(fee.type === "fixed" || fee.type === "mixed") && (
                <div className="space-y-2">
                  <Label>Fixed Amount ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={fee.amount || ""}
                    onChange={(e) => updateFee(index, "amount", parseFloat(e.target.value))}
                    placeholder="0.30"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Applies To</Label>
                <div className="space-y-2">
                  {PAYMENT_METHOD_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    return (
                      <div key={option.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`fee-${index}-${option.value}`}
                          checked={fee.appliesTo?.includes(option.value) || false}
                          onCheckedChange={(checked) => {
                            const currentAppliesTo = fee.appliesTo || [];
                            const newAppliesTo = checked
                              ? [...currentAppliesTo, option.value]
                              : currentAppliesTo.filter((m) => m !== option.value);
                            updateFee(index, "appliesTo", newAppliesTo);
                          }}
                        />
                        <Label
                          htmlFor={`fee-${index}-${option.value}`}
                          className="text-sm font-normal cursor-pointer flex items-center"
                        >
                          <Icon className="mr-2 h-4 w-4" />
                          {option.label}
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {fees.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <CreditCard className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Fees Configured</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Add transaction fees to configure payment processing costs
                </p>
                <Button type="button" variant="outline" onClick={addFee}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Fee
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </TabsContent>
  );
}
