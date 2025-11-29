"use client";

import { useState, useEffect } from "react";
import { 
  BudgetCategory, 
  BudgetPeriod, 
  BudgetTransaction, 
  BudgetOverview,
  BudgetAnalytics,
  BudgetFormData 
} from "@/types/finance.types";
import { 
  mockBudgetCategories,
  mockBudgetPeriods,
  mockBudgetTransactions,
  mockBudgetOverview,
  mockBudgetAnalytics
} from "@/lib/data/mock-budget-data";

export function useBudget() {
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [periods, setPeriods] = useState<BudgetPeriod[]>([]);
  const [transactions, setTransactions] = useState<BudgetTransaction[]>([]);
  const [overview, setOverview] = useState<BudgetOverview | null>(null);
  const [analytics, setAnalytics] = useState<BudgetAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Simulate API calls
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setCategories(mockBudgetCategories);
        setPeriods(mockBudgetPeriods);
        setTransactions(mockBudgetTransactions);
        setOverview(mockBudgetOverview);
        setAnalytics(mockBudgetAnalytics);
      } catch (err) {
        setError('Failed to load budget data');
        console.error('Error loading budget data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const createCategory = async (data: BudgetFormData): Promise<BudgetCategory> => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newCategory: BudgetCategory = {
        id: Date.now().toString(),
        name: data.name,
        description: data.description,
        color: data.color,
        allocatedAmount: data.allocatedAmount,
        spentAmount: 0,
        remainingAmount: data.allocatedAmount,
        percentageUsed: 0,
        status: 'on-track',
        subcategories: data.subcategories?.map((sub, index) => ({
          id: `${Date.now()}-${index}`,
          name: sub.name,
          allocatedAmount: sub.allocatedAmount,
          spentAmount: 0,
          remainingAmount: sub.allocatedAmount,
          percentageUsed: 0
        })) || []
      };

      setCategories(prev => [...prev, newCategory]);
      return newCategory;
    } catch (err) {
      setError('Failed to create category');
      throw err;
    }
  };

  const updateCategory = async (id: string, data: BudgetFormData): Promise<BudgetCategory> => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const updatedCategory: BudgetCategory = {
        id,
        name: data.name,
        description: data.description,
        color: data.color,
        allocatedAmount: data.allocatedAmount,
        spentAmount: 0, // In a real app, this would be calculated from transactions
        remainingAmount: data.allocatedAmount,
        percentageUsed: 0,
        status: 'on-track',
        subcategories: data.subcategories?.map((sub, index) => ({
          id: `${id}-${index}`,
          name: sub.name,
          allocatedAmount: sub.allocatedAmount,
          spentAmount: 0,
          remainingAmount: sub.allocatedAmount,
          percentageUsed: 0
        })) || []
      };

      setCategories(prev => 
        prev.map(cat => cat.id === id ? updatedCategory : cat)
      );
      return updatedCategory;
    } catch (err) {
      setError('Failed to update category');
      throw err;
    }
  };

  const deleteCategory = async (id: string): Promise<void> => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setCategories(prev => prev.filter(cat => cat.id !== id));
      setTransactions(prev => prev.filter(tx => tx.categoryId !== id));
    } catch (err) {
      setError('Failed to delete category');
      throw err;
    }
  };

  const createTransaction = async (transaction: Omit<BudgetTransaction, 'id'>): Promise<BudgetTransaction> => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newTransaction: BudgetTransaction = {
        ...transaction,
        id: Date.now().toString()
      };

      setTransactions(prev => [newTransaction, ...prev]);
      
      // Update category spending
      setCategories(prev => 
        prev.map(cat => {
          if (cat.id === transaction.categoryId) {
            const newSpentAmount = cat.spentAmount + transaction.amount;
            return {
              ...cat,
              spentAmount: newSpentAmount,
              remainingAmount: cat.allocatedAmount - newSpentAmount,
              percentageUsed: (newSpentAmount / cat.allocatedAmount) * 100,
              status: newSpentAmount > cat.allocatedAmount ? 'over-budget' : 
                     newSpentAmount > cat.allocatedAmount * 0.9 ? 'warning' : 'on-track'
            };
          }
          return cat;
        })
      );
      
      return newTransaction;
    } catch (err) {
      setError('Failed to create transaction');
      throw err;
    }
  };

  const updateTransaction = async (id: string, updates: Partial<BudgetTransaction>): Promise<BudgetTransaction> => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setTransactions(prev => 
        prev.map(tx => tx.id === id ? { ...tx, ...updates } : tx)
      );
      
      const updatedTransaction = transactions.find(tx => tx.id === id);
      if (!updatedTransaction) throw new Error('Transaction not found');
      
      return { ...updatedTransaction, ...updates };
    } catch (err) {
      setError('Failed to update transaction');
      throw err;
    }
  };

  const deleteTransaction = async (id: string): Promise<void> => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const transaction = transactions.find(tx => tx.id === id);
      if (!transaction) throw new Error('Transaction not found');
      
      setTransactions(prev => prev.filter(tx => tx.id !== id));
      
      // Update category spending
      setCategories(prev => 
        prev.map(cat => {
          if (cat.id === transaction.categoryId) {
            const newSpentAmount = cat.spentAmount - transaction.amount;
            return {
              ...cat,
              spentAmount: newSpentAmount,
              remainingAmount: cat.allocatedAmount - newSpentAmount,
              percentageUsed: (newSpentAmount / cat.allocatedAmount) * 100,
              status: newSpentAmount > cat.allocatedAmount ? 'over-budget' : 
                     newSpentAmount > cat.allocatedAmount * 0.9 ? 'warning' : 'on-track'
            };
          }
          return cat;
        })
      );
    } catch (err) {
      setError('Failed to delete transaction');
      throw err;
    }
  };

  const refreshData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real app, this would fetch fresh data from the API
      setCategories(mockBudgetCategories);
      setPeriods(mockBudgetPeriods);
      setTransactions(mockBudgetTransactions);
      setOverview(mockBudgetOverview);
      setAnalytics(mockBudgetAnalytics);
    } catch (err) {
      setError('Failed to refresh data');
      console.error('Error refreshing budget data:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    categories,
    periods,
    transactions,
    overview,
    analytics,
    loading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    refreshData
  };
}