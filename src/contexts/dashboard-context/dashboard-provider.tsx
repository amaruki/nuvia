"use client";

import * as React from "react";
import { createContext } from "react";

import { dashboardReducer, initialState } from "./dashboard-reducer";
import type { DashboardAction, DashboardState } from "./types";

export const DashboardContext = createContext<{
  state: DashboardState;
  dispatch: React.Dispatch<DashboardAction>;
} | null>(null);

interface DashboardProviderProps {
  children: React.ReactNode;
}

/**
 * Shell state for the dashboard: notifications and the page header.
 *
 * Sidebar collapse state deliberately does NOT live here (UI-22): the
 * sidebar primitives under src/components/ui/sidebar own it in the
 * `sidebar_state` cookie, and a second browser-storage copy here gave
 * the two stores room to disagree. The theme slice was likewise dead —
 * next-themes owns the theme and nothing ever read it.
 */
export function DashboardProvider({ children }: DashboardProviderProps) {
  const [state, dispatch] = React.useReducer(dashboardReducer, initialState);

  return (
    <DashboardContext.Provider value={{ state, dispatch }}>{children}</DashboardContext.Provider>
  );
}
