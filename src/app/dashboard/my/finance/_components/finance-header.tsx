"use client";

/**
 * UI-34 — sets the dashboard header for the server-rendered member finance
 * page: server components can't reach the header context, so this tiny
 * client component does it for them (same arrangement as UI-32's inbox).
 */

import { useEffect } from "react";
import { useHeader } from "@/contexts/dashboard-context";

export function FinanceHeader() {
  const { setHeader, clearHeader } = useHeader();

  useEffect(() => {
    setHeader({
      title: "My Finance",
      description: "Your dues, invoices and payments.",
    });

    return () => {
      clearHeader();
    };
  }, [setHeader, clearHeader]);

  return null;
}
