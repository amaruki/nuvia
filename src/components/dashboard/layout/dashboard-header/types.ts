import * as React from "react";
import type { Notification } from "@/types/dashboard.types";

export interface BreadcrumbEntry {
  label: string;
  href?: string;
}

export interface DashboardHeaderProps {
  title?: string;
  description?: string;
  breadcrumbs?: BreadcrumbEntry[];
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
  actions?: React.ReactNode;
  className?: string;
  notificationCount?: number;
  notifications?: Notification[];
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onDismiss?: (id: string) => void;
  onViewAllNotifications?: () => void;
}
