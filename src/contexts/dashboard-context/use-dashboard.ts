"use client";

import { use } from "react";

import { DashboardContext } from "./dashboard-provider";

export function useDashboard() {
  const context = use(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
}
