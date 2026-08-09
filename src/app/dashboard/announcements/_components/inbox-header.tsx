"use client";

/**
 * UI-32 — Sets the dashboard header for the server-rendered member
 * announcements inbox: server components can't reach the header context, so
 * this tiny client component does it for them (same arrangement the award
 * nominations page uses).
 */

import { useEffect } from "react";
import { useHeader } from "@/contexts/dashboard-context";

export function InboxHeader() {
  const { setHeader, clearHeader } = useHeader();

  useEffect(() => {
    setHeader({
      title: "Announcements",
      description: "Published announcements for members, newest first.",
    });

    return () => {
      clearHeader();
    };
  }, [setHeader, clearHeader]);

  return null;
}
