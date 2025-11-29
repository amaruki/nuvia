import { 
  BudgetCategory, 
  BudgetPeriod, 
  BudgetTransaction, 
  BudgetOverview,
  BudgetAnalytics 
} from '@/types/finance.types';

export const mockBudgetCategories: BudgetCategory[] = [
  {
    id: '1',
    name: 'Operations',
    description: 'Day-to-day operational expenses',
    color: '#3b82f6',
    allocatedAmount: 50000,
    spentAmount: 32500,
    remainingAmount: 17500,
    percentageUsed: 65,
    status: 'on-track',
    subcategories: [
      {
        id: '1-1',
        name: 'Office Supplies',
        allocatedAmount: 8000,
        spentAmount: 5200,
        remainingAmount: 2800,
        percentageUsed: 65
      },
      {
        id: '1-2',
        name: 'Utilities',
        allocatedAmount: 12000,
        spentAmount: 7800,
        remainingAmount: 4200,
        percentageUsed: 65
      },
      {
        id: '1-3',
        name: 'Maintenance',
        allocatedAmount: 15000,
        spentAmount: 9750,
        remainingAmount: 5250,
        percentageUsed: 65
      },
      {
        id: '1-4',
        name: 'Insurance',
        allocatedAmount: 15000,
        spentAmount: 9750,
        remainingAmount: 5250,
        percentageUsed: 65
      }
    ]
  },
  {
    id: '2',
    name: 'Marketing',
    description: 'Marketing and promotional activities',
    color: '#10b981',
    allocatedAmount: 35000,
    spentAmount: 31500,
    remainingAmount: 3500,
    percentageUsed: 90,
    status: 'warning',
    subcategories: [
      {
        id: '2-1',
        name: 'Digital Advertising',
        allocatedAmount: 15000,
        spentAmount: 13500,
        remainingAmount: 1500,
        percentageUsed: 90
      },
      {
        id: '2-2',
        name: 'Events',
        allocatedAmount: 12000,
        spentAmount: 10800,
        remainingAmount: 1200,
        percentageUsed: 90
      },
      {
        id: '2-3',
        name: 'Content Creation',
        allocatedAmount: 8000,
        spentAmount: 7200,
        remainingAmount: 800,
        percentageUsed: 90
      }
    ]
  },
  {
    id: '3',
    name: 'Personnel',
    description: 'Employee salaries and benefits',
    color: '#8b5cf6',
    allocatedAmount: 120000,
    spentAmount: 96000,
    remainingAmount: 24000,
    percentageUsed: 80,
    status: 'on-track',
    subcategories: [
      {
        id: '3-1',
        name: 'Salaries',
        allocatedAmount: 90000,
        spentAmount: 72000,
        remainingAmount: 18000,
        percentageUsed: 80
      },
      {
        id: '3-2',
        name: 'Benefits',
        allocatedAmount: 20000,
        spentAmount: 16000,
        remainingAmount: 4000,
        percentageUsed: 80
      },
      {
        id: '3-3',
        name: 'Training',
        allocatedAmount: 10000,
        spentAmount: 8000,
        remainingAmount: 2000,
        percentageUsed: 80
      }
    ]
  },
  {
    id: '4',
    name: 'Technology',
    description: 'Software, hardware, and IT infrastructure',
    color: '#f59e0b',
    allocatedAmount: 25000,
    spentAmount: 28750,
    remainingAmount: -3750,
    percentageUsed: 115,
    status: 'over-budget',
    subcategories: [
      {
        id: '4-1',
        name: 'Software Licenses',
        allocatedAmount: 10000,
        spentAmount: 11500,
        remainingAmount: -1500,
        percentageUsed: 115
      },
      {
        id: '4-2',
        name: 'Hardware',
        allocatedAmount: 8000,
        spentAmount: 9200,
        remainingAmount: -1200,
        percentageUsed: 115
      },
      {
        id: '4-3',
        name: 'Cloud Services',
        allocatedAmount: 7000,
        spentAmount: 8050,
        remainingAmount: -1050,
        percentageUsed: 115
      }
    ]
  },
  {
    id: '5',
    name: 'Events',
    description: 'Conferences, meetings, and gatherings',
    color: '#ef4444',
    allocatedAmount: 20000,
    spentAmount: 8000,
    remainingAmount: 12000,
    percentageUsed: 40,
    status: 'on-track',
    subcategories: [
      {
        id: '5-1',
        name: 'Conferences',
        allocatedAmount: 12000,
        spentAmount: 4800,
        remainingAmount: 7200,
        percentageUsed: 40
      },
      {
        id: '5-2',
        name: 'Meetings',
        allocatedAmount: 5000,
        spentAmount: 2000,
        remainingAmount: 3000,
        percentageUsed: 40
      },
      {
        id: '5-3',
        name: 'Social Events',
        allocatedAmount: 3000,
        spentAmount: 1200,
        remainingAmount: 1800,
        percentageUsed: 40
      }
    ]
  }
];

export const mockBudgetPeriods: BudgetPeriod[] = [
  {
    id: '1',
    name: 'Q1 2024',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-03-31'),
    totalBudget: 250000,
    totalSpent: 196750,
    totalRemaining: 53250,
    status: 'active',
    categories: mockBudgetCategories
  },
  {
    id: '2',
    name: 'Q4 2023',
    startDate: new Date('2023-10-01'),
    endDate: new Date('2023-12-31'),
    totalBudget: 240000,
    totalSpent: 228000,
    totalRemaining: 12000,
    status: 'completed',
    categories: mockBudgetCategories.map(cat => ({
      ...cat,
      spentAmount: cat.allocatedAmount * 0.95,
      remainingAmount: cat.allocatedAmount * 0.05,
      percentageUsed: 95
    }))
  },
  {
    id: '3',
    name: 'Q2 2024',
    startDate: new Date('2024-04-01'),
    endDate: new Date('2024-06-30'),
    totalBudget: 260000,
    totalSpent: 0,
    totalRemaining: 260000,
    status: 'upcoming',
    categories: mockBudgetCategories.map(cat => ({
      ...cat,
      spentAmount: 0,
      remainingAmount: cat.allocatedAmount,
      percentageUsed: 0
    }))
  }
];

export const mockBudgetTransactions: BudgetTransaction[] = [
  {
    id: '1',
    categoryId: '1',
    subcategoryId: '1-1',
    description: 'Office supplies purchase',
    amount: 450,
    date: new Date('2024-01-15'),
    type: 'expense',
    status: 'approved',
    vendor: 'Office Depot',
    receiptUrl: '/receipts/office-supplies-001.pdf',
    notes: 'Monthly office supplies restock',
    approvedBy: 'John Doe',
    approvedAt: new Date('2024-01-16')
  },
  {
    id: '2',
    categoryId: '2',
    subcategoryId: '2-1',
    description: 'Google Ads campaign',
    amount: 2500,
    date: new Date('2024-01-20'),
    type: 'expense',
    status: 'approved',
    vendor: 'Google',
    notes: 'Q1 digital advertising campaign',
    approvedBy: 'Jane Smith',
    approvedAt: new Date('2024-01-21')
  },
  {
    id: '3',
    categoryId: '4',
    subcategoryId: '4-1',
    description: 'Microsoft 365 licenses',
    amount: 1200,
    date: new Date('2024-01-25'),
    type: 'expense',
    status: 'pending',
    vendor: 'Microsoft',
    notes: 'Annual software license renewal'
  },
  {
    id: '4',
    categoryId: '3',
    subcategoryId: '3-1',
    description: 'Employee salaries',
    amount: 30000,
    date: new Date('2024-02-01'),
    type: 'expense',
    status: 'approved',
    vendor: 'Payroll System',
    notes: 'February payroll',
    approvedBy: 'HR Manager',
    approvedAt: new Date('2024-02-02')
  },
  {
    id: '5',
    categoryId: '5',
    subcategoryId: '5-1',
    description: 'Tech conference registration',
    amount: 1500,
    date: new Date('2024-02-10'),
    type: 'expense',
    status: 'approved',
    vendor: 'TechConf 2024',
    receiptUrl: '/receipts/techconf-2024.pdf',
    notes: 'Annual technology conference',
    approvedBy: 'CTO',
    approvedAt: new Date('2024-02-11')
  }
];

export const mockBudgetOverview: BudgetOverview = {
  totalBudget: 250000,
  totalSpent: 196750,
  totalRemaining: 53250,
  percentageUsed: 78.7,
  periodComparison: {
    currentPeriod: 196750,
    previousPeriod: 228000,
    change: -31250,
    changePercentage: -13.7
  },
  topCategories: mockBudgetCategories.slice(0, 5),
  recentTransactions: mockBudgetTransactions.slice(0, 5)
};

export const mockBudgetAnalytics: BudgetAnalytics = {
  spendingTrends: [
    { month: 'Jan', amount: 65000, budget: 83333 },
    { month: 'Feb', amount: 72000, budget: 83333 },
    { month: 'Mar', amount: 59750, budget: 83333 },
    { month: 'Apr', amount: 0, budget: 86667 },
    { month: 'May', amount: 0, budget: 86667 },
    { month: 'Jun', amount: 0, budget: 86667 }
  ],
  categoryBreakdown: mockBudgetCategories.map(cat => ({
    category: cat.name,
    amount: cat.spentAmount,
    percentage: (cat.spentAmount / mockBudgetOverview.totalSpent) * 100
  })),
  monthlyComparison: [
    { month: 'Jan', currentYear: 65000, previousYear: 58000 },
    { month: 'Feb', currentYear: 72000, previousYear: 69000 },
    { month: 'Mar', currentYear: 59750, previousYear: 62000 }
  ],
  varianceAnalysis: mockBudgetCategories.map(cat => ({
    category: cat.name,
    budgeted: cat.allocatedAmount,
    actual: cat.spentAmount,
    variance: cat.allocatedAmount - cat.spentAmount,
    variancePercentage: ((cat.allocatedAmount - cat.spentAmount) / cat.allocatedAmount) * 100
  }))
};