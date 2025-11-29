"use client";

import { useState, useEffect } from "react";
import { 
  MemberDue, 
  DuePayment, 
  DueReminder, 
  DueStatistics, 
  DueFilterOptions 
} from "@/types/finance.types";
import { 
  mockMemberDues, 
  mockDuePayments, 
  mockDueReminders, 
  mockDueStatistics 
} from "@/lib/data/mock-dues-data";

export function useDues() {
  const [dues, setDues] = useState<MemberDue[]>([]);
  const [payments, setPayments] = useState<DuePayment[]>([]);
  const [reminders, setReminders] = useState<DueReminder[]>([]);
  const [statistics, setStatistics] = useState<DueStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<DueFilterOptions>({});

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setDues(mockMemberDues);
        setPayments(mockDuePayments);
        setReminders(mockDueReminders);
        setStatistics(mockDueStatistics);
        setError(null);
      } catch (err) {
        setError("Failed to fetch dues data");
        console.error("Error fetching dues:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter dues based on current filters
  const filteredDues = dues.filter(due => {
    if (filters.status && filters.status.length > 0) {
      if (!filters.status.includes(due.status)) return false;
    }
    
    if (filters.tier && filters.tier.length > 0) {
      if (!filters.tier.includes(due.membershipTier)) return false;
    }
    
    if (filters.dateRange) {
      const dueDate = new Date(due.dueDate);
      if (dueDate < filters.dateRange.start || dueDate > filters.dateRange.end) {
        return false;
      }
    }
    
    if (filters.amountRange) {
      if (due.dueAmount < filters.amountRange.min || due.dueAmount > filters.amountRange.max) {
        return false;
      }
    }
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      if (
        !due.memberName.toLowerCase().includes(searchLower) &&
        !due.memberEmail.toLowerCase().includes(searchLower) &&
        !due.membershipTier.toLowerCase().includes(searchLower)
      ) {
        return false;
      }
    }
    
    return true;
  });

  // Action functions
  const updateDueStatus = async (dueId: string, status: MemberDue['status']) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setDues(prev => prev.map(due => 
        due.id === dueId 
          ? { ...due, status, updatedAt: new Date() }
          : due
      ));
      
      // Update statistics
      if (statistics) {
        const updatedDues = dues.map(due => 
          due.id === dueId ? { ...due, status } : due
        );
        updateStatistics(updatedDues);
      }
    } catch (err) {
      setError("Failed to update due status");
      console.error("Error updating due status:", err);
    }
  };

  const recordPayment = async (dueId: string, amount: number, paymentMethod: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newPayment: DuePayment = {
        id: `payment-${Date.now()}`,
        dueId,
        amount,
        paymentDate: new Date(),
        paymentMethod,
        transactionId: `txn_${Date.now()}`,
        status: "completed",
        processedBy: "current_user",
        createdAt: new Date(),
      };
      
      setPayments(prev => [...prev, newPayment]);
      
      // Update due with payment
      setDues(prev => prev.map(due => {
        if (due.id === dueId) {
          const newPaidAmount = due.paidAmount + amount;
          const newBalanceAmount = due.balanceAmount - amount;
          const newStatus = newBalanceAmount <= 0 ? "paid" : 
                          newBalanceAmount < due.dueAmount ? "partial" : due.status;
          
          return {
            ...due,
            paidAmount: newPaidAmount,
            balanceAmount: Math.max(0, newBalanceAmount),
            status: newStatus,
            paidDate: newBalanceAmount <= 0 ? new Date() : due.paidDate,
            paymentMethod,
            transactionId: newPayment.transactionId,
            updatedAt: new Date(),
          };
        }
        return due;
      }));
      
      // Update statistics
      const updatedDues = dues.map(due => {
        if (due.id === dueId) {
          const newPaidAmount = due.paidAmount + amount;
          const newBalanceAmount = due.balanceAmount - amount;
          return {
            ...due,
            paidAmount: newPaidAmount,
            balanceAmount: Math.max(0, newBalanceAmount),
          };
        }
        return due;
      });
      updateStatistics(updatedDues);
    } catch (err) {
      setError("Failed to record payment");
      console.error("Error recording payment:", err);
    }
  };

  const sendReminder = async (dueId: string, reminderType: DueReminder['reminderType']) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const due = dues.find(d => d.id === dueId);
      if (!due) throw new Error("Due not found");
      
      const newReminder: DueReminder = {
        id: `reminder-${Date.now()}`,
        dueId,
        reminderType,
        scheduledDate: new Date(),
        sentDate: new Date(),
        status: "sent",
        template: "payment_reminder_template",
        recipient: due.memberEmail,
        createdAt: new Date(),
      };
      
      setReminders(prev => [...prev, newReminder]);
    } catch (err) {
      setError("Failed to send reminder");
      console.error("Error sending reminder:", err);
    }
  };

  const refreshData = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setDues(mockMemberDues);
      setPayments(mockDuePayments);
      setReminders(mockDueReminders);
      setStatistics(mockDueStatistics);
      setError(null);
    } catch (err) {
      setError("Failed to refresh data");
      console.error("Error refreshing data:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateFilters = (newFilters: Partial<DueFilterOptions>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  // Helper function to update statistics
  const updateStatistics = (updatedDues: MemberDue[]) => {
    const totalAmount = updatedDues.reduce((sum, due) => sum + due.dueAmount, 0);
    const collectedAmount = updatedDues.reduce((sum, due) => sum + due.paidAmount, 0);
    const pendingAmount = updatedDues
      .filter(due => due.status === 'pending')
      .reduce((sum, due) => sum + due.balanceAmount, 0);
    const overdueAmount = updatedDues
      .filter(due => due.status === 'overdue')
      .reduce((sum, due) => sum + due.balanceAmount, 0);
    const overdueCount = updatedDues.filter(due => due.status === 'overdue').length;
    const upcomingDues = updatedDues.filter(due => {
      const dueDate = new Date(due.dueDate);
      const today = new Date();
      const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
      return due.status === 'pending' && dueDate <= thirtyDaysFromNow;
    }).length;

    setStatistics(prev => prev ? {
      ...prev,
      totalDues: updatedDues.length,
      totalAmount,
      collectedAmount,
      pendingAmount,
      overdueAmount,
      collectionRate: totalAmount > 0 ? (collectedAmount / totalAmount) * 100 : 0,
      overdueCount,
      upcomingDues,
    } : null);
  };

  return {
    dues: filteredDues,
    allDues: dues,
    payments,
    reminders,
    statistics,
    loading,
    error,
    filters,
    updateDueStatus,
    recordPayment,
    sendReminder,
    refreshData,
    updateFilters,
    clearFilters,
  };
}