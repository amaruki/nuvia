"use client";

import * as React from "react";

import { useDashboard } from "./use-dashboard";

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
