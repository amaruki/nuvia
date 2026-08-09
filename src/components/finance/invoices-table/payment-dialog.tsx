import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Invoice } from "@/types/finance";
import { formatCurrency, getBalanceAmount, validatePaymentAmount } from "./helpers";

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice | null;
  amount: string;
  onAmountChange: (amount: string) => void;
  method: string;
  onMethodChange: (method: string) => void;
  onSubmit: () => void;
}

export default function PaymentDialog({
  open,
  onOpenChange,
  invoice,
  amount,
  onAmountChange,
  method,
  onMethodChange,
  onSubmit,
}: PaymentDialogProps) {
  const balance = invoice ? getBalanceAmount(invoice) : null;
  // Only surface errors once the user has typed something; an empty field is
  // handled by the disabled submit button.
  const amountError = amount ? validatePaymentAmount(amount, balance) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>Record a payment for {invoice?.clientName}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Payment Amount</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => onAmountChange(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                aria-invalid={amountError ? true : undefined}
                aria-describedby={amountError ? "amount-error" : undefined}
              />
              {amountError && (
                <p id="amount-error" role="alert" className="text-sm text-destructive">
                  {amountError}
                </p>
              )}
              {invoice && (
                <p className="text-sm text-muted-foreground">
                  Outstanding: {formatCurrency(getBalanceAmount(invoice))}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select value={method} onValueChange={onMethodChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Credit Card">Credit Card</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="PayPal">PayPal</SelectItem>
                  <SelectItem value="Check">Check</SelectItem>
                  <SelectItem value="Cash">Cash</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={!amount || !method || amountError !== null}>
            Record Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
