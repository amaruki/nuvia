"use client";

import * as React from "react";

import type { DashboardNotification } from "./types";
import { useDashboard } from "./use-dashboard";

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
