"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  PaymentGateway, 
  GatewayOverallStatistics, 
  GatewayTransaction, 
  GatewayTestResult, 
  GatewayFilterOptions,
  GatewayFormData 
} from "@/types/finance.types";
import { 
  mockPaymentGateways, 
  mockGatewayStatistics, 
  mockGatewayTransactions, 
  mockGatewayTestResults 
} from "@/lib/data/mock-gateway-data";

export function useGateways() {
  const [gateways, setGateways] = useState<PaymentGateway[]>([]);
  const [transactions, setTransactions] = useState<GatewayTransaction[]>([]);
  const [testResults, setTestResults] = useState<GatewayTestResult[]>([]);
  const [statistics, setStatistics] = useState<GatewayOverallStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<GatewayFilterOptions>({});

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setGateways(mockPaymentGateways);
        setTransactions(mockGatewayTransactions);
        setTestResults(mockGatewayTestResults);
        setStatistics(mockGatewayStatistics);
        setError(null);
      } catch (err) {
        setError("Failed to load gateway data");
        console.error("Error loading gateway data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter gateways based on current filters
  const filteredGateways = gateways.filter(gateway => {
    if (filters.status && !filters.status.includes(gateway.status)) return false;
    if (filters.provider && !filters.provider.includes(gateway.provider)) return false;
    if (filters.environment && !filters.environment.includes(gateway.environment)) return false;
    if (filters.currency && !filters.currency.some(currency => gateway.currencies.includes(currency))) return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        gateway.displayName.toLowerCase().includes(searchLower) ||
        gateway.name.toLowerCase().includes(searchLower) ||
        gateway.provider.toLowerCase().includes(searchLower) ||
        (gateway.description && gateway.description.toLowerCase().includes(searchLower))
      );
    }
    return true;
  });

  // Filter transactions based on current filters
  const filteredTransactions = transactions.filter(transaction => {
    if (filters.status && !filters.status.includes(transaction.status)) return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        transaction.transactionId.toLowerCase().includes(searchLower) ||
        transaction.gatewayName.toLowerCase().includes(searchLower) ||
        (transaction.customerName && transaction.customerName.toLowerCase().includes(searchLower)) ||
        (transaction.customerEmail && transaction.customerEmail.toLowerCase().includes(searchLower))
      );
    }
    return true;
  });

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<GatewayFilterOptions>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  // Refresh data
  const refreshData = useCallback(async () => {
    try {
      setLoading(true);
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setGateways(mockPaymentGateways);
      setTransactions(mockGatewayTransactions);
      setTestResults(mockGatewayTestResults);
      setStatistics(mockGatewayStatistics);
      setError(null);
    } catch (err) {
      setError("Failed to refresh gateway data");
      console.error("Error refreshing gateway data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Add new gateway
  const addGateway = useCallback(async (gatewayData: GatewayFormData) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newGateway: PaymentGateway = {
        id: `gw_${Date.now()}`,
        name: gatewayData.name,
        provider: gatewayData.provider,
        displayName: gatewayData.displayName,
        description: gatewayData.description,
        status: "testing",
        environment: gatewayData.environment,
        currencies: gatewayData.currencies,
        supportedPaymentMethods: [], // TODO: Implement payment methods
        transactionFees: gatewayData.transactionFees.map((fee, index) => ({
          id: `fee_${Date.now()}_${index}`,
          type: fee.type || "fixed",
          name: fee.name || "Standard Fee",
          description: fee.description,
          amount: fee.amount || 0,
          percentage: fee.percentage || 0,
          minAmount: fee.minAmount,
          maxAmount: fee.maxAmount,
          currency: "USD",
          appliesTo: fee.appliesTo || [],
          isActive: true,
        })),
        webhookUrl: gatewayData.webhookUrl,
        merchantId: gatewayData.merchantId,
        accountId: gatewayData.accountId,
        isDefault: gatewayData.isDefault,
        isEnabled: gatewayData.isEnabled,
        configuration: {
          allowPartialPayments: false,
          requireCvv: true,
          require3ds: false,
          autoCapture: true,
          settlementDelay: 48,
          refundPolicy: "full",
          disputeManagement: true,
          fraudDetection: true,
          recurringPayments: false,
          subscriptionSupport: false,
          maxTransactionAmount: 10000,
          minTransactionAmount: 0.50,
          dailyTransactionLimit: 50000,
          monthlyTransactionLimit: 1000000,
          webhookRetries: 3,
          timeoutDuration: 30,
          ...gatewayData.configuration,
        },
        statistics: {
          totalTransactions: 0,
          totalVolume: 0,
          successRate: 0,
          averageTransactionValue: 0,
          totalFees: 0,
          chargebackCount: 0,
          refundCount: 0,
          dailyTransactions: [],
          monthlyTransactions: [],
          paymentMethodBreakdown: [],
          errorRates: [],
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: "current-user@example.com",
      };

      setGateways(prev => [...prev, newGateway]);
      return newGateway;
    } catch (err) {
      setError("Failed to add gateway");
      console.error("Error adding gateway:", err);
      throw err;
    }
  }, []);

  // Update existing gateway
  const updateGateway = useCallback(async (id: string, gatewayData: Partial<GatewayFormData>) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setGateways(prev => prev.map(gateway =>
        gateway.id === id
          ? {
              ...gateway,
              name: gatewayData.name || gateway.name,
              provider: gatewayData.provider || gateway.provider,
              displayName: gatewayData.displayName || gateway.displayName,
              description: gatewayData.description !== undefined ? gatewayData.description : gateway.description,
              environment: gatewayData.environment || gateway.environment,
              currencies: gatewayData.currencies || gateway.currencies,
              transactionFees: gatewayData.transactionFees ?
                gatewayData.transactionFees.map((fee, index) => ({
                  id: fee.id || `fee_${Date.now()}_${index}`,
                  type: fee.type || "fixed",
                  name: fee.name || "Standard Fee",
                  description: fee.description,
                  amount: fee.amount || 0,
                  percentage: fee.percentage || 0,
                  minAmount: fee.minAmount,
                  maxAmount: fee.maxAmount,
                  currency: "USD",
                  appliesTo: fee.appliesTo || [],
                  isActive: true,
                })) : gateway.transactionFees,
              webhookUrl: gatewayData.webhookUrl !== undefined ? gatewayData.webhookUrl : gateway.webhookUrl,
              merchantId: gatewayData.merchantId !== undefined ? gatewayData.merchantId : gateway.merchantId,
              accountId: gatewayData.accountId !== undefined ? gatewayData.accountId : gateway.accountId,
              isDefault: gatewayData.isDefault !== undefined ? gatewayData.isDefault : gateway.isDefault,
              isEnabled: gatewayData.isEnabled !== undefined ? gatewayData.isEnabled : gateway.isEnabled,
              configuration: gatewayData.configuration ?
                { ...gateway.configuration, ...gatewayData.configuration } : gateway.configuration,
              updatedAt: new Date(),
              updatedBy: "current-user@example.com",
            }
          : gateway
      ));
    } catch (err) {
      setError("Failed to update gateway");
      console.error("Error updating gateway:", err);
      throw err;
    }
  }, []);

  // Delete gateway
  const deleteGateway = useCallback(async (id: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setGateways(prev => prev.filter(gateway => gateway.id !== id));
    } catch (err) {
      setError("Failed to delete gateway");
      console.error("Error deleting gateway:", err);
      throw err;
    }
  }, []);

  // Toggle gateway status
  const toggleGatewayStatus = useCallback(async (id: string, enabled: boolean) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setGateways(prev => prev.map(gateway => 
        gateway.id === id 
          ? { 
              ...gateway, 
              isEnabled: enabled,
              status: enabled ? "active" : "inactive",
              updatedAt: new Date(),
              updatedBy: "current-user@example.com",
            }
          : gateway
      ));
    } catch (err) {
      setError("Failed to toggle gateway status");
      console.error("Error toggling gateway status:", err);
      throw err;
    }
  }, []);

  // Test gateway connection
  const testGateway = useCallback(async (id: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const testResult: GatewayTestResult = {
        gatewayId: id,
        testType: "connection",
        status: "success",
        message: "Connection successful",
        details: { responseTime: `${Math.floor(Math.random() * 300 + 50)}ms` },
        testedAt: new Date(),
        duration: Math.floor(Math.random() * 300 + 50),
      };

      setTestResults(prev => [testResult, ...prev]);
      
      // Update gateway's last tested date
      setGateways(prev => prev.map(gateway => 
        gateway.id === id 
          ? { 
              ...gateway, 
              lastTestedAt: new Date(),
              updatedAt: new Date(),
              updatedBy: "current-user@example.com",
            }
          : gateway
      ));

      return testResult;
    } catch (err) {
      const testResult: GatewayTestResult = {
        gatewayId: id,
        testType: "connection",
        status: "failed",
        message: "Connection failed",
        details: { error: "Unable to connect to gateway" },
        testedAt: new Date(),
        duration: 5000,
      };

      setTestResults(prev => [testResult, ...prev]);
      throw err;
    }
  }, []);

  // Set default gateway
  const setDefaultGateway = useCallback(async (id: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setGateways(prev => prev.map(gateway => ({
        ...gateway,
        isDefault: gateway.id === id,
        updatedAt: new Date(),
        updatedBy: "current-user@example.com",
      })));
    } catch (err) {
      setError("Failed to set default gateway");
      console.error("Error setting default gateway:", err);
      throw err;
    }
  }, []);

  return {
    // Data
    gateways: filteredGateways,
    transactions: filteredTransactions,
    testResults,
    statistics,
    loading,
    error,
    filters,

    // Actions
    updateFilters,
    clearFilters,
    refreshData,
    addGateway,
    updateGateway,
    deleteGateway,
    toggleGatewayStatus,
    testGateway,
    setDefaultGateway,
  };
}