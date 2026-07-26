"use client";

import * as React from "react";
import { createContext, useContext, use } from "react";
import { logger } from "@/lib/logger";

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
  memberStats: {
    totalMembers: number;
    activeMembers: number;
    newMembers: number;
  } | null;
  eventStats: {
    upcomingEvents: number;
    totalEvents: number;
    thisWeekEvents: number;
  } | null;

  // UI State
  sidebarCollapsed: boolean;
  theme: "light" | "dark" | "system";

  // Header state
  header: {
    title?: string;
    description?: string;
    actions?: React.ReactNode;
  };

  // Loading states
  isRefreshing: boolean;
  lastRefresh: Date | null;
}

type DashboardAction =
  | { type: "SET_NOTIFICATIONS"; payload: DashboardNotification[] }
  | { type: "ADD_NOTIFICATION"; payload: DashboardNotification }
  | { type: "MARK_NOTIFICATION_READ"; payload: string }
  | { type: "MARK_ALL_NOTIFICATIONS_READ" }
  | { type: "SET_MEMBER_STATS"; payload: DashboardState["memberStats"] }
  | { type: "SET_EVENT_STATS"; payload: DashboardState["eventStats"] }
  | { type: "TOGGLE_SIDEBAR" }
  | { type: "SET_THEME"; payload: DashboardState["theme"] }
  | { type: "SET_HEADER"; payload: DashboardState["header"] }
  | { type: "CLEAR_HEADER" }
  | { type: "SET_REFRESHING"; payload: boolean }
  | { type: "SET_LAST_REFRESH"; payload: Date }
  | { type: "REFRESH_DATA" };

const DashboardContext = createContext<{
  state: DashboardState;
  dispatch: React.Dispatch<DashboardAction>;
} | null>(null);

function dashboardReducer(state: DashboardState, action: DashboardAction): DashboardState {
  switch (action.type) {
    case "SET_NOTIFICATIONS":
      return {
        ...state,
        notifications: action.payload,
      };

    case "ADD_NOTIFICATION":
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
      };

    case "MARK_NOTIFICATION_READ":
      return {
        ...state,
        notifications: state.notifications.map((notif) =>
          notif.id === action.payload ? { ...notif, read: true } : notif,
        ),
      };

    case "MARK_ALL_NOTIFICATIONS_READ":
      return {
        ...state,
        notifications: state.notifications.map((notif) => ({ ...notif, read: true })),
      };

    case "SET_MEMBER_STATS":
      return {
        ...state,
        memberStats: action.payload,
      };

    case "SET_EVENT_STATS":
      return {
        ...state,
        eventStats: action.payload,
      };

    case "TOGGLE_SIDEBAR":
      return {
        ...state,
        sidebarCollapsed: !state.sidebarCollapsed,
      };

    case "SET_THEME":
      return {
        ...state,
        theme: action.payload,
      };

    case "SET_HEADER":
      return {
        ...state,
        header: action.payload,
      };

    case "CLEAR_HEADER":
      return {
        ...state,
        header: {},
      };

    case "SET_REFRESHING":
      return {
        ...state,
        isRefreshing: action.payload,
      };

    case "SET_LAST_REFRESH":
      return {
        ...state,
        lastRefresh: action.payload,
      };

    case "REFRESH_DATA":
      return {
        ...state,
        isRefreshing: true,
        lastRefresh: new Date(),
      };

    default:
      return state;
  }
}

const initialState: DashboardState = {
  notifications: [],
  memberStats: null,
  eventStats: null,
  sidebarCollapsed: false,
  theme: "system",
  header: {},
  isRefreshing: false,
  lastRefresh: null,
};

interface DashboardProviderProps {
  children: React.ReactNode;
}

export function DashboardProvider({ children }: DashboardProviderProps) {
  const [state, dispatch] = React.useReducer(dashboardReducer, initialState);

  // Load initial state from localStorage
  React.useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("dashboard-theme") as DashboardState["theme"];
      const savedCollapsed = localStorage.getItem("dashboard-sidebar-collapsed") === "true";

      if (savedTheme) {
        dispatch({ type: "SET_THEME", payload: savedTheme });
      }
      if (savedCollapsed) {
        dispatch({ type: "TOGGLE_SIDEBAR" });
      }
    } catch (error) {
      logger.warn("Failed to load dashboard state from localStorage", error);
    }
  }, []);

  // Save state to localStorage
  React.useEffect(() => {
    try {
      localStorage.setItem("dashboard-theme", state.theme);
      localStorage.setItem("dashboard-sidebar-collapsed", state.sidebarCollapsed.toString());
    } catch (error) {
      logger.warn("Failed to save dashboard state to localStorage", error);
    }
  }, [state.theme, state.sidebarCollapsed]);

  return (
    <DashboardContext.Provider value={{ state, dispatch }}>{children}</DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = use(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
}

// Convenience hooks for specific state slices
export function useNotifications() {
  const { state, dispatch } = useDashboard();

  const markAsRead = React.useCallback(
    (id: string) => {
      dispatch({ type: "MARK_NOTIFICATION_READ", payload: id });
    },
    [dispatch],
  );

  const markAllAsRead = React.useCallback(() => {
    dispatch({ type: "MARK_ALL_NOTIFICATIONS_READ" });
  }, [dispatch]);

  const addNotification = React.useCallback(
    (notification: Omit<DashboardNotification, "id" | "timestamp">) => {
      const newNotification: DashboardNotification = {
        ...notification,
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date(),
      };
      dispatch({ type: "ADD_NOTIFICATION", payload: newNotification });
    },
    [dispatch],
  );

  const unreadCount = React.useMemo(() => {
    return state.notifications.filter((n) => !n.read).length;
  }, [state.notifications]);

  return {
    notifications: state.notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    addNotification,
  };
}

export function useDashboardStats() {
  const { state, dispatch } = useDashboard();

  const updateMemberStats = React.useCallback(
    (stats: DashboardState["memberStats"]) => {
      dispatch({ type: "SET_MEMBER_STATS", payload: stats });
    },
    [dispatch],
  );

  const updateEventStats = React.useCallback(
    (stats: DashboardState["eventStats"]) => {
      dispatch({ type: "SET_EVENT_STATS", payload: stats });
    },
    [dispatch],
  );

  return {
    memberStats: state.memberStats,
    eventStats: state.eventStats,
    updateMemberStats,
    updateEventStats,
    isRefreshing: state.isRefreshing,
    lastRefresh: state.lastRefresh,
  };
}

export function useHeader() {
  const { state, dispatch } = useDashboard();

  const setHeader = React.useCallback(
    (header: { title?: string; description?: string; actions?: React.ReactNode }) => {
      dispatch({ type: "SET_HEADER", payload: header });
    },
    [dispatch],
  );

  const clearHeader = React.useCallback(() => {
    dispatch({ type: "CLEAR_HEADER" });
  }, [dispatch]);

  return {
    ...state.header,
    setHeader,
    clearHeader,
  };
}
