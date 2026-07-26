"use client";

import { useState, useEffect } from "react";
import {
  Invoice,
  InvoicePayment,
  InvoiceStatistics,
  InvoiceFilterOptions,
} from "@/types/finance.types";
import {
  mockInvoices,
  mockInvoicePayments,
  mockInvoiceStatistics,
} from "@/lib/data/mock-invoice-data";

export function useInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<InvoicePayment[]>([]);
  const [statistics, setStatistics] = useState<InvoiceStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<InvoiceFilterOptions>({});

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));

        setInvoices(mockInvoices);
        setPayments(mockInvoicePayments);
        setStatistics(mockInvoiceStatistics);
        setError(null);
      } catch (err) {
        setError("Failed to fetch invoices data");
        console.error("Error fetching invoices:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter invoices based on current filters
  const filteredInvoices = invoices.filter((invoice) => {
    if (filters.status && filters.status.length > 0) {
      if (!filters.status.includes(invoice.status)) return false;
    }

    if (filters.client && filters.client.length > 0) {
      if (!filters.client.includes(invoice.clientId)) return false;
    }

    if (filters.dateRange) {
      const issueDate = new Date(invoice.issueDate);
      if (issueDate < filters.dateRange.start || issueDate > filters.dateRange.end) {
        return false;
      }
    }

    if (filters.amountRange) {
      if (
        invoice.totalAmount < filters.amountRange.min ||
        invoice.totalAmount > filters.amountRange.max
      ) {
        return false;
      }
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      if (
        !invoice.clientName.toLowerCase().includes(searchLower) &&
        !invoice.clientEmail.toLowerCase().includes(searchLower) &&
        !invoice.invoiceNumber.toLowerCase().includes(searchLower)
      ) {
        return false;
      }
    }

    return true;
  });

  // Action functions
  const updateInvoiceStatus = async (invoiceId: string, status: Invoice["status"]) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      setInvoices((prev) =>
        prev.map((invoice) =>
          invoice.id === invoiceId ? { ...invoice, status, updatedAt: new Date() } : invoice,
        ),
      );

      // Update statistics
      if (statistics) {
        const updatedInvoices = invoices.map((invoice) =>
          invoice.id === invoiceId ? { ...invoice, status } : invoice,
        );
        updateStatistics(updatedInvoices);
      }
    } catch (err) {
      setError("Failed to update invoice status");
      console.error("Error updating invoice status:", err);
    }
  };

  const recordPayment = async (invoiceId: string, amount: number, paymentMethod: string) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      const newPayment: InvoicePayment = {
        id: `payment-${Date.now()}`,
        invoiceId,
        amount,
        paymentDate: new Date(),
        paymentMethod,
        transactionId: `txn_${Date.now()}`,
        status: "completed",
        processedBy: "current_user",
        createdAt: new Date(),
      };

      setPayments((prev) => [...prev, newPayment]);

      // Update invoice with payment
      setInvoices((prev) =>
        prev.map((invoice) => {
          if (invoice.id === invoiceId) {
            const newPaidAmount = invoice.paidAmount ? invoice.paidAmount + amount : amount;
            const newBalanceAmount = invoice.totalAmount - newPaidAmount;
            const newStatus =
              newBalanceAmount <= 0 ? "paid" : newPaidAmount > 0 ? "sent" : invoice.status;

            return {
              ...invoice,
              paidAmount: newPaidAmount,
              status: newStatus,
              paidDate: newBalanceAmount <= 0 ? new Date() : invoice.paidDate,
              paymentMethod,
              transactionId: newPayment.transactionId,
              updatedAt: new Date(),
            };
          }
          return invoice;
        }),
      );

      // Update statistics
      const updatedInvoices = invoices.map((invoice) => {
        if (invoice.id === invoiceId) {
          const newPaidAmount = invoice.paidAmount ? invoice.paidAmount + amount : amount;
          return {
            ...invoice,
            paidAmount: newPaidAmount,
          };
        }
        return invoice;
      });
      updateStatistics(updatedInvoices);
    } catch (err) {
      setError("Failed to record payment");
      console.error("Error recording payment:", err);
    }
  };

  const sendInvoice = async (invoiceId: string) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      setInvoices((prev) =>
        prev.map((invoice) =>
          invoice.id === invoiceId
            ? { ...invoice, status: "sent", updatedAt: new Date() }
            : invoice,
        ),
      );
    } catch (err) {
      setError("Failed to send invoice");
      console.error("Error sending invoice:", err);
    }
  };

  const refreshData = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setInvoices(mockInvoices);
      setPayments(mockInvoicePayments);
      setStatistics(mockInvoiceStatistics);
      setError(null);
    } catch (err) {
      setError("Failed to refresh data");
      console.error("Error refreshing data:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateFilters = (newFilters: Partial<InvoiceFilterOptions>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  // Helper function to update statistics
  const updateStatistics = (updatedInvoices: Invoice[]) => {
    const totalAmount = updatedInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
    const paidAmount = updatedInvoices.reduce((sum, invoice) => sum + (invoice.paidAmount || 0), 0);
    const pendingAmount = updatedInvoices
      .filter((invoice) => invoice.status === "sent")
      .reduce((sum, invoice) => sum + (invoice.totalAmount - (invoice.paidAmount || 0)), 0);
    const overdueAmount = updatedInvoices
      .filter((invoice) => invoice.status === "overdue")
      .reduce((sum, invoice) => sum + (invoice.totalAmount - (invoice.paidAmount || 0)), 0);
    const overdueCount = updatedInvoices.filter((invoice) => invoice.status === "overdue").length;
    const upcomingInvoices = updatedInvoices.filter((invoice) => {
      const dueDate = new Date(invoice.dueDate);
      const today = new Date();
      const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
      return invoice.status === "sent" && dueDate <= thirtyDaysFromNow;
    }).length;

    setStatistics((prev) =>
      prev
        ? {
            ...prev,
            totalInvoices: updatedInvoices.length,
            totalAmount,
            paidAmount,
            pendingAmount,
            overdueAmount,
            collectionRate: totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0,
            overdueCount,
            upcomingInvoices,
          }
        : null,
    );
  };

  return {
    invoices: filteredInvoices,
    allInvoices: invoices,
    payments,
    statistics,
    loading,
    error,
    filters,
    updateInvoiceStatus,
    recordPayment,
    sendInvoice,
    refreshData,
    updateFilters,
    clearFilters,
  };
}
