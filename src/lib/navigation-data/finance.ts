import type { NavItemData } from "./types";

export const financeSection: readonly NavItemData[] = [
  // Financial Management Section
  {
    id: "finance",
    title: "Finance",
    path: "/dashboard/finance",
    category: "main",
    roles: ["admin", "superadmin", "treasurer", "staff"],
    subItems: [
      {
        id: "budget-management",
        title: "Budgets",
        path: "/dashboard/finance/budget",
        roles: ["admin", "superadmin", "treasurer", "chapter_president", "committee_chair"],
      },
      {
        id: "dues-management",
        title: "Dues",
        path: "/dashboard/finance/dues",
        roles: ["admin", "superadmin", "treasurer", "staff"],
      },
      {
        id: "invoices-billing",
        title: "Invoices",
        path: "/dashboard/finance/invoices",
        roles: ["admin", "superadmin", "treasurer", "staff"],
      },
      {
        id: "donations-grants",
        title: "Donations",
        path: "/dashboard/finance/donations",
        roles: ["admin", "superadmin", "treasurer", "staff"],
      },
      {
        id: "financial-reports",
        title: "Reports",
        path: "/dashboard/finance/reports",
        roles: ["admin", "superadmin", "treasurer"],
      },
      {
        id: "payment-gateways",
        title: "Gateways",
        path: "/dashboard/finance/gateways",
        roles: ["admin", "superadmin", "treasurer"],
      },
    ] as const,
  },
] as const;
