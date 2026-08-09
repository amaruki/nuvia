"use client";

import * as React from "react";

import type { DashboardState } from "./types";
import { useDashboard } from "./use-dashboard";

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
