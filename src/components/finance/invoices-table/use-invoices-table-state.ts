"use client";

import { useState } from "react";
import type { Invoice } from "@/types/finance";
import { getBalanceAmount } from "./helpers";

interface UseInvoicesTableStateOptions {
  onRecordPayment: (invoiceId: string, amount: number, paymentMethod: string) => void;
}

export function useInvoicesTableState({ onRecordPayment }: UseInvoicesTableStateOptions) {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");

  const handleViewDetails = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setDetailsModalOpen(true);
  };

  const handleRecordPayment = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setPaymentAmount(getBalanceAmount(invoice).toString());
    setPaymentDialogOpen(true);
  };

  const handlePaymentSubmit = () => {
    if (selectedInvoice && paymentAmount && paymentMethod) {
      onRecordPayment(selectedInvoice.id, parseFloat(paymentAmount), paymentMethod);
      setPaymentDialogOpen(false);
      setSelectedInvoice(null);
      setPaymentAmount("");
      setPaymentMethod("");
    }
  };

  return {
    selectedInvoice,
    detailsModalOpen,
    setDetailsModalOpen,
    paymentDialogOpen,
    setPaymentDialogOpen,
    paymentAmount,
    setPaymentAmount,
    paymentMethod,
    setPaymentMethod,
    handleViewDetails,
    handleRecordPayment,
    handlePaymentSubmit,
  };
}
