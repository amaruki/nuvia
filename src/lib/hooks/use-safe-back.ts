"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

import { resolveBackTarget } from "@/lib/utils/navigation";

/**
 * Client half of the safe-back rule (UI-24 item 6). Reads the browser's
 * history/referrer at call time, then either calls router.back() or
 * navigates to the fallback route when back would leave the site.
 */
export function useSafeBack(fallback = "/events"): () => void {
  const router = useRouter();

  return useCallback(() => {
    const target = resolveBackTarget(
      {
        historyLength: window.history.length,
        referrer: document.referrer,
        origin: window.location.origin,
      },
      fallback,
    );
    if (target) {
      router.push(target);
    } else {
      router.back();
    }
  }, [router, fallback]);
}
