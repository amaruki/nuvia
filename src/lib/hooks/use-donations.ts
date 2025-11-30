"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  Donation, 
  DonationCampaign, 
  DonationPayment, 
  DonationStatistics, 
  DonationFilterOptions 
} from "@/types/finance.types";
import { 
  mockDonations, 
  mockDonationCampaigns, 
  mockDonationPayments, 
  mockDonationStatistics 
} from "@/lib/data/mock-donation-data";

export function useDonations() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [campaigns, setCampaigns] = useState<DonationCampaign[]>([]);
  const [payments, setPayments] = useState<DonationPayment[]>([]);
  const [statistics, setStatistics] = useState<DonationStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<DonationFilterOptions>({});

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setDonations(mockDonations);
        setCampaigns(mockDonationCampaigns);
        setPayments(mockDonationPayments);
        setStatistics(mockDonationStatistics);
        setError(null);
      } catch (err) {
        setError("Failed to load donation data");
        console.error("Error loading donation data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter donations based on current filters
  const filteredDonations = useMemo(() => {
    let filtered = [...donations];

    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter(d => filters.status!.includes(d.status));
    }

    if (filters.donorType && filters.donorType.length > 0) {
      filtered = filtered.filter(d => filters.donorType!.includes(d.donorType));
    }

    if (filters.donationType && filters.donationType.length > 0) {
      filtered = filtered.filter(d => filters.donationType!.includes(d.donationType));
    }

    if (filters.campaign && filters.campaign.length > 0) {
      filtered = filtered.filter(d => d.campaign && filters.campaign!.includes(d.campaign));
    }

    if (filters.dateRange) {
      const { start, end } = filters.dateRange;
      filtered = filtered.filter(d => {
        const donationDate = new Date(d.donationDate);
        return donationDate >= start && donationDate <= end;
      });
    }

    if (filters.amountRange) {
      const { min, max } = filters.amountRange;
      filtered = filtered.filter(d => d.amount >= min && d.amount <= max);
    }

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(d => 
        d.donorName.toLowerCase().includes(searchTerm) ||
        d.donorEmail.toLowerCase().includes(searchTerm) ||
        (d.campaign && d.campaign.toLowerCase().includes(searchTerm)) ||
        (d.notes && d.notes.toLowerCase().includes(searchTerm))
      );
    }

    return filtered;
  }, [donations, filters]);

  // Update donation status
  const updateDonationStatus = async (donationId: string, status: Donation['status']) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setDonations(prev => 
        prev.map(d => 
          d.id === donationId 
            ? { ...d, status, updatedAt: new Date() }
            : d
        )
      );
      
      return true;
    } catch (err) {
      console.error("Error updating donation status:", err);
      return false;
    }
  };

  // Record a payment for a donation
  const recordPayment = async (donationId: string, amount: number, paymentMethod: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const newPayment: DonationPayment = {
        id: `payment-${Date.now()}`,
        donationId,
        amount,
        paymentDate: new Date(),
        paymentMethod,
        transactionId: `txn_${Date.now()}`,
        status: "completed",
        processedBy: "current-user",
        createdAt: new Date(),
      };
      
      setPayments(prev => [...prev, newPayment]);
      
      // Update donation status if fully paid
      setDonations(prev =>
        prev.map(d => {
          if (d.id === donationId) {
            const totalPaid = payments
              .filter(p => p.donationId === donationId)
              .reduce((sum, p) => sum + p.amount, 0) + amount;
            
            return {
              ...d,
              status: totalPaid >= d.amount ? "completed" : "pending",
              paymentMethod,
              transactionId: newPayment.transactionId,
              updatedAt: new Date(),
            };
          }
          return d;
        })
      );
      
      return true;
    } catch (err) {
      console.error("Error recording payment:", err);
      return false;
    }
  };

  // Send donation receipt
  const sendReceipt = async (donationId: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setDonations(prev => 
        prev.map(d => 
          d.id === donationId 
            ? { ...d, receiptSent: true, updatedAt: new Date() }
            : d
        )
      );
      
      return true;
    } catch (err) {
      console.error("Error sending receipt:", err);
      return false;
    }
  };

  // Add a new donation
  const addDonation = async (data: any) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const newDonation: Donation = {
        id: `donation-${Date.now()}`,
        donorId: data.donorId,
        donorName: data.donorType === "anonymous" ? "Anonymous" : data.donorId.includes('@') ? data.donorId.split('@')[0] : data.donorId,
        donorEmail: data.donorId.includes('@') ? data.donorId : `${data.donorId}@example.com`,
        donorType: data.donorType,
        donationType: data.donationType,
        campaign: data.campaign === "general" ? undefined : data.campaign,
        amount: data.amount,
        currency: data.currency || "USD",
        status: data.donationType === "pledge" ? "pledged" : "pending",
        paymentMethod: undefined,
        transactionId: undefined,
        donationDate: new Date(),
        receiptSent: data.sendReceipt || false,
        notes: data.notes,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      setDonations(prev => [newDonation, ...prev]);
      
      // Simulate sending receipt and thank you if requested
      if (data.sendReceipt) {
        console.log("Receipt sent to:", newDonation.donorEmail);
      }
      
      if (data.sendThankYou) {
        console.log("Thank you message sent to:", newDonation.donorEmail);
      }
      
      return true;
    } catch (err) {
      console.error("Error adding donation:", err);
      return false;
    }
  };

  // Refresh data
  const refreshData = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setDonations(mockDonations);
      setCampaigns(mockDonationCampaigns);
      setPayments(mockDonationPayments);
      setStatistics(mockDonationStatistics);
      setError(null);
    } catch (err) {
      setError("Failed to refresh donation data");
      console.error("Error refreshing donation data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Update filters
  const updateFilters = (newFilters: Partial<DonationFilterOptions>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({});
  };

  return {
    donations: filteredDonations,
    campaigns,
    payments,
    statistics,
    loading,
    error,
    filters,
    updateDonationStatus,
    recordPayment,
    sendReceipt,
    addDonation,
    refreshData,
    updateFilters,
    clearFilters,
  };
}