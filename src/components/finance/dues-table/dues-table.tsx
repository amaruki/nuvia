"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { MemberDue } from "@/types/finance";
import { DueDetailsModal } from "@/components/finance/due-details-modal";
import { DueRow } from "./due-row";
import { PaymentDialog } from "./payment-dialog";
import type { DuesTableProps } from "./types";

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
              {dues.map((due) => (
                <DueRow
                  key={due.id}
                  due={due}
                  onViewDetails={handleViewDetails}
                  onRecordPayment={handleRecordPayment}
                  onSendReminder={onSendReminder}
                  onUpdateStatus={onUpdateStatus}
                />
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <PaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        due={selectedDue}
        amount={paymentAmount}
        onAmountChange={setPaymentAmount}
        method={paymentMethod}
        onMethodChange={setPaymentMethod}
        onSubmit={handlePaymentSubmit}
      />

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
