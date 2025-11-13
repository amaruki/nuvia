import React from "react";
import {
  Home,
  Users,
  Calendar,
  Megaphone,
  DollarSign,
  BarChart3,
  User,
  CalendarCheck,
  CreditCard,
  Shield,
  Smartphone,
  Activity,
  Settings,
  Cog,
} from "lucide-react";
import { UserRole } from "@/types/dashboard.types";

export interface NavigationItem {
  readonly id: string;
  readonly title: string;
  readonly icon: React.ReactNode;
  readonly path: string;
  readonly badge?: string | null;
  readonly roles?: UserRole[];
  readonly category?: "main" | "personal" | "admin" | "system";
  readonly subItems?: readonly NavigationItem[];
  readonly isActive?: boolean;
}

export const navigationConfig: readonly NavigationItem[] = [
  // Main Navigation
  {
    id: "dashboard",
    title: "Dashboard",
    icon: <Home className="h-4 w-4" />,
    path: "/dashboard",
    category: "main",
  },
  {
    id: "members",
    title: "Members",
    icon: <Users className="h-4 w-4" />,
    path: "/dashboard/members",
    category: "main",
    roles: ["admin", "moderator"],
    subItems: [
      {
        id: "member-directory",
        title: "Directory",
        icon: <Users className="h-4 w-4" />,
        path: "/dashboard/members/directory",
      },
      {
        id: "member-requests",
        title: "Requests",
        icon: <User className="h-4 w-4" />,
        path: "/dashboard/members/requests",
        badge: "3",
      },
      {
        id: "member-types",
        title: "Types",
        icon: <Shield className="h-4 w-4" />,
        path: "/dashboard/members/types",
      },
    ] as const,
  },
  {
    id: "events",
    title: "Events",
    icon: <Calendar className="h-4 w-4" />,
    path: "/dashboard/events",
    category: "main",
    badge: "2",
    subItems: [
      {
        id: "event-calendar",
        title: "Calendar",
        icon: <CalendarCheck className="h-4 w-4" />,
        path: "/dashboard/events/calendar",
      },
      {
        id: "create-event",
        title: "Create",
        icon: <Calendar className="h-4 w-4" />,
        path: "/dashboard/events/create",
      },
      {
        id: "event-registrations",
        title: "Registrations",
        icon: <Users className="h-4 w-4" />,
        path: "/dashboard/events/registrations",
      },
    ] as const,
  },
  {
    id: "communications",
    title: "Communications",
    icon: <Megaphone className="h-4 w-4" />,
    path: "/dashboard/communications",
    category: "main",
    subItems: [
      {
        id: "announcements",
        title: "Announcements",
        icon: <Megaphone className="h-4 w-4" />,
        path: "/dashboard/communications/announcements",
      },
      {
        id: "newsletters",
        title: "Newsletters",
        icon: <Megaphone className="h-4 w-4" />,
        path: "/dashboard/communications/newsletters",
      },
      {
        id: "notifications",
        title: "Notifications",
        icon: <Megaphone className="h-4 w-4" />,
        path: "/dashboard/communications/notifications",
        badge: "5",
      },
    ] as const,
  },
  {
    id: "finance",
    title: "Finance",
    icon: <DollarSign className="h-4 w-4" />,
    path: "/dashboard/finance",
    category: "main",
    roles: ["admin", "moderator"],
    subItems: [
      {
        id: "dues-management",
        title: "Dues",
        icon: <CreditCard className="h-4 w-4" />,
        path: "/dashboard/finance/dues",
      },
      {
        id: "budgeting",
        title: "Budget",
        icon: <CreditCard className="h-4 w-4" />,
        path: "/dashboard/finance/budget",
      },
      {
        id: "revenue",
        title: "Revenue",
        icon: <DollarSign className="h-4 w-4" />,
        path: "/dashboard/finance/revenue",
      },
    ] as const,
  },
  {
    id: "reports",
    title: "Reports",
    icon: <BarChart3 className="h-4 w-4" />,
    path: "/dashboard/reports",
    category: "main",
    roles: ["admin", "moderator"],
    subItems: [
      {
        id: "member-analytics",
        title: "Members",
        icon: <Users className="h-4 w-4" />,
        path: "/dashboard/reports/members",
      },
      {
        id: "financial-reports",
        title: "Financial",
        icon: <BarChart3 className="h-4 w-4" />,
        path: "/dashboard/reports/financial",
      },
      {
        id: "event-reports",
        title: "Events",
        icon: <Calendar className="h-4 w-4" />,
        path: "/dashboard/reports/events",
      },
      {
        id: "custom-reports",
        title: "Custom",
        icon: <BarChart3 className="h-4 w-4" />,
        path: "/dashboard/reports/custom",
      },
    ] as const,
  },

  // Personal Section
  {
    id: "profile",
    title: "Profile",
    icon: <User className="h-4 w-4" />,
    path: "/dashboard/profile",
    category: "personal",
  },
  {
    id: "my-events",
    title: "My Events",
    icon: <CalendarCheck className="h-4 w-4" />,
    path: "/dashboard/my-events",
    category: "personal",
    badge: "1",
  },
  {
    id: "billing",
    title: "Billing",
    icon: <CreditCard className="h-4 w-4" />,
    path: "/dashboard/billing",
    category: "personal",
  },

  // System Section
  {
    id: "active-devices",
    title: "Devices",
    icon: <Smartphone className="h-4 w-4" />,
    path: "/dashboard/active-devices",
    category: "system",
  },
  {
    id: "login-activities",
    title: "Activity",
    icon: <Activity className="h-4 w-4" />,
    path: "/dashboard/login-activities",
    category: "system",
  },

  // Admin Section
  {
    id: "moderation",
    title: "Moderation",
    icon: <Shield className="h-4 w-4" />,
    path: "/dashboard/moderation",
    category: "admin",
    roles: ["admin", "moderator"],
  },
  {
    id: "system-settings",
    title: "System",
    icon: <Settings className="h-4 w-4" />,
    path: "/dashboard/settings/system",
    category: "admin",
    roles: ["admin"],
  },
  {
    id: "settings",
    title: "Settings",
    icon: <Cog className="h-4 w-4" />,
    path: "/dashboard/settings",
    category: "system",
  },
] as const;

export const navigationCategories = {
  main: "Navigation",
  personal: "Personal",
  admin: "Admin",
  system: "System",
} as const;