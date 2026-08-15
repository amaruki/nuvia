"use client";

/**
 * Sets the dashboard shell header (title + description) from any page —
 * including server components, which can't call useHeader directly. Render
 * it anywhere inside the page tree; it outputs nothing itself.
 *
 * Client pages that already run their own effects may call useHeader()
 * directly instead; every other page should use this island so the header
 * convention stays a single code path.
 */

import { useEffect } from "react";

import { useHeader } from "@/contexts/dashboard-context";

interface PageHeaderProps {
  title: string;
  description?: string;
}

export function PageHeader({ title, description }: PageHeaderProps) {
  const { setHeader, clearHeader } = useHeader();

  useEffect(() => {
    setHeader({ title, description });

    return () => {
      clearHeader();
    };
  }, [title, description, setHeader, clearHeader]);

  return null;
}
