"use client";

import { useEffect, useState } from "react";

/**
 * Returns true only after the component has mounted on the client.
 *
 * Session-gated public views (join CTAs, apply forms, comment forms) must
 * render their pending placeholder on the first client render to match the
 * server output — `useSession()` is always pending during SSR but can
 * resolve before hydration on the client, and branching on it directly
 * produces a hydration mismatch that regenerates the tree (dropping the
 * theme attribute in the process).
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
}
