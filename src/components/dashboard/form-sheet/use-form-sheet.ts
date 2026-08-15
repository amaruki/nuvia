"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export type FormSheetMode = "closed" | "create" | "edit";

export interface FormSheetState {
  mode: FormSheetMode;
  /** The entity id when mode is "edit", otherwise null. */
  editId: string | null;
  /** True whenever the sheet should be open (create or edit). */
  open: boolean;
  openCreate: () => void;
  openEdit: (id: string) => void;
  close: () => void;
}

const NEW_VALUE = "new";

/**
 * URL-driven open state for the standard CRUD form sheet.
 *
 * `?<param>=new` opens the create form, `?<param>=<id>` opens the edit form
 * for that id. The URL is the single source of truth: sheet links are
 * shareable, a refresh keeps the sheet open, and the browser back button
 * closes it. `router.replace` keeps history clean so back does not replay
 * every open/close, and scroll is preserved because opening a form should
 * not jump the list behind it.
 */
export function useFormSheet(param = "form"): FormSheetState {
  const router = useRouter();
  const searchParams = useSearchParams();
  const raw = searchParams.get(param);

  const mode: FormSheetMode = raw === null ? "closed" : raw === NEW_VALUE ? "create" : "edit";

  const setParam = useCallback(
    (value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === null) {
        params.delete(param);
      } else {
        params.set(param, value);
      }
      const query = params.toString();
      router.replace(query ? `?${query}` : window.location.pathname, { scroll: false });
    },
    [param, router, searchParams],
  );

  return {
    mode,
    editId: mode === "edit" ? raw : null,
    open: mode !== "closed",
    openCreate: useCallback(() => setParam(NEW_VALUE), [setParam]),
    openEdit: useCallback((id: string) => setParam(id), [setParam]),
    close: useCallback(() => setParam(null), [setParam]),
  };
}
