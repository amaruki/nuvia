import type * as React from "react";

export interface DashboardNotification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  timestamp: Date;
  read: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface DashboardState {
  // Real-time data
  notifications: DashboardNotification[];

  // UI State
  sidebarCollapsed: boolean;
  theme: "light" | "dark" | "system";

  // Header state
  header: {
    title?: string;
    description?: string;
    actions?: React.ReactNode;
  };
}

export type DashboardAction =
  | { type: "SET_NOTIFICATIONS"; payload: DashboardNotification[] }
  | { type: "ADD_NOTIFICATION"; payload: DashboardNotification }
  | { type: "MARK_NOTIFICATION_READ"; payload: string }
  | { type: "MARK_ALL_NOTIFICATIONS_READ" }
  | { type: "TOGGLE_SIDEBAR" }
  | { type: "SET_THEME"; payload: DashboardState["theme"] }
  | { type: "SET_HEADER"; payload: DashboardState["header"] }
  | { type: "CLEAR_HEADER" };
