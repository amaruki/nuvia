"use client";

import * as React from "react";
import { createContext } from "react";

import { logger } from "@/lib/logger";

import { dashboardReducer, initialState } from "./dashboard-reducer";
import type { DashboardAction, DashboardState } from "./types";

export const DashboardContext = createContext<{
  state: DashboardState;
  dispatch: React.Dispatch<DashboardAction>;
} | null>(null);

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
