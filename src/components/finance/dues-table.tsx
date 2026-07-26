"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  MoreHorizontal,
  Mail,
  CreditCard,
  Eye,
  CheckCircle,
  AlertCircle,
  Clock,
  XCircle,
} from "lucide-react";
import { MemberDue, DuePayment } from "@/types/finance.types";
import { DueDetailsModal } from "@/components/finance/due-details-modal";

interface DuesTableProps {
  dues: MemberDue[];
  payments: DuePayment[];
  onRecordPayment: (dueId: string, amount: number, paymentMethod: string) => void;
  onSendReminder: (dueId: string, type: "email" | "sms" | "in_app") => void;
  onUpdateStatus: (dueId: string, status: MemberDue["status"]) => void;
}

export function DuesTable({
  dues,
  payments,
  onRecordPayment,
  onSendReminder,
  onUpdateStatus,
}: DuesTableProps) {
  const [selectedDue, setSelectedDue] = useState<MemberDue | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: MemberDue["status"]) => {
    switch (status) {
      case "paid":
        return { variant: "default" as const, icon: CheckCircle, text: "Paid" };
      case "pending":
        return { variant: "secondary" as const, icon: Clock, text: "Pending" };
      case "overdue":
        return { variant: "destructive" as const, icon: AlertCircle, text: "Overdue" };
      case "partial":
        return { variant: "outline" as const, icon: CreditCard, text: "Partial" };
      case "cancelled":
        return { variant: "outline" as const, icon: XCircle, text: "Cancelled" };
      default:
        return { variant: "secondary" as const, icon: Clock, text: status };
    }
  };

  const handleViewDetails = (due: MemberDue) => {
    setSelectedDue(due);
    setDetailsModalOpen(true);
  };

  const handleRecordPayment = (due: MemberDue) => {
    setSelectedDue(due);
    setPaymentAmount(due.balanceAmount.toString());
    setPaymentDialogOpen(true);
  };

  const handlePaymentSubmit = () => {
    if (selectedDue && paymentAmount && paymentMethod) {
      onRecordPayment(selectedDue.id, parseFloat(paymentAmount), paymentMethod);
      setPaymentDialogOpen(false);
      setSelectedDue(null);
      setPaymentAmount("");
      setPaymentMethod("");
    }
  };

  const isOverdue = (dueDate: Date, status: MemberDue["status"]) => {
    return status === "pending" && new Date(dueDate) < new Date();
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Member Dues</CardTitle>
          <CardDescription>Manage and track membership fee payments</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Due Amount</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dues.map((due) => {
                const statusBadge = getStatusBadge(due.status);
                const StatusIcon = statusBadge.icon;

                return (
                  <TableRow key={due.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{due.memberName}</div>
                        <div className="text-sm text-muted-foreground">{due.memberEmail}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{due.membershipTier}</Badge>
                    </TableCell>
                    <TableCell>{formatCurrency(due.dueAmount)}</TableCell>
                    <TableCell>{formatCurrency(due.paidAmount)}</TableCell>
                    <TableCell className={due.balanceAmount > 0 ? "font-medium" : ""}>
                      {formatCurrency(due.balanceAmount)}
                    </TableCell>
                    <TableCell>
                      <div className={isOverdue(due.dueDate, due.status) ? "text-red-600" : ""}>
                        {new Date(due.dueDate).toLocaleDateString()}
                        {isOverdue(due.dueDate, due.status) && (
                          <div className="text-xs">Overdue</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={statusBadge.variant}
                        className="flex items-center gap-1 w-fit"
                      >
                        <StatusIcon className="h-3 w-3" />
                        {statusBadge.text}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewDetails(due)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>

                          {due.status !== "paid" && due.status !== "cancelled" && (
                            <>
                              <DropdownMenuItem onClick={() => handleRecordPayment(due)}>
                                <CreditCard className="mr-2 h-4 w-4" />
                                Record Payment
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />

                              <DropdownMenuItem onClick={() => onSendReminder(due.id, "email")}>
                                <Mail className="mr-2 h-4 w-4" />
                                Send Email Reminder
                              </DropdownMenuItem>
                            </>
                          )}

                          {/* TODO: Implement status change actions in future */}
                          {due.status === "pending" && (
                            <DropdownMenuItem onClick={() => onUpdateStatus(due.id, "overdue")}>
                              <AlertCircle className="mr-2 h-4 w-4" />
                              Mark as Overdue
                            </DropdownMenuItem>
                          )}

                          {due.status === "overdue" && (
                            <DropdownMenuItem onClick={() => onUpdateStatus(due.id, "pending")}>
                              <Clock className="mr-2 h-4 w-4" />
                              Mark as Pending
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>Record a payment for {selectedDue?.memberName}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Payment Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
                {selectedDue && (
                  <p className="text-sm text-muted-foreground">
                    Outstanding: {formatCurrency(selectedDue.balanceAmount)}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Credit Card">Credit Card</SelectItem>
                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                    <SelectItem value="PayPal">PayPal</SelectItem>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Check">Check</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePaymentSubmit} disabled={!paymentAmount || !paymentMethod}>
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Due Details Modal */}
      <DueDetailsModal
        due={selectedDue}
        payments={payments}
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        onRecordPayment={onRecordPayment}
        onSendReminder={onSendReminder}
      />
    </>
  );
}
