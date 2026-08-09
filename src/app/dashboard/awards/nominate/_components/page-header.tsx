"use client";

/**
 * Sets the dashboard header for the server-rendered nominate page — server
 * components can't reach the header context, so this tiny client component
 * does it for them (same arrangement other dashboard pages use directly).
 */

import { useEffect } from "react";
import { useHeader } from "@/contexts/dashboard-context";

export function NominatePageHeader() {
  const { setHeader, clearHeader } = useHeader();

  useEffect(() => {
    setHeader({
      title: "Award Nominations",
      description: "Nominate a deserving member for an open award program.",
    });

    return () => {
      clearHeader();
    };
  }, [setHeader, clearHeader]);

  return null;
}
