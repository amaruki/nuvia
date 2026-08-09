"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { apiFetch } from "@/lib/api-client";
import type { DataTableUrlState } from "@/hooks/use-data-table-state";
import { hydrateAnnouncement } from "@/lib/hooks/use-announcements/hydrate-announcement";
import { hydrateArticle } from "@/lib/hooks/use-articles/hydrate-article";
import { hydratePublication } from "@/lib/hooks/use-publications/hydrate-publication";
import type { RawContentItem as RawAnnouncementRow } from "@/lib/hooks/use-announcements/types";
import type { RawContentItem as RawArticleRow } from "@/lib/hooks/use-articles/types";
import type { RawContentItem as RawPublicationRow } from "@/lib/hooks/use-publications/types";
import type { Article } from "@/types/article";
import type { Announcement } from "@/types/announcement";
import type { Publication } from "@/types/publication";

import type { ContentCollectionSlug, ContentTableMeta, WireContentItem } from "./types";

export interface ContentTableQuery<T> {
  rows: T[];
  total: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export interface UseContentTableQueryOptions<T> {
  collection: ContentCollectionSlug;
  /** URL-synced table state from useDataTableState. */
  state: DataTableUrlState;
  /** Maps a wire row to the domain object the columns render. */
  hydrate: (raw: WireContentItem) => T;
  /** Column ids the list endpoint accepts as sortBy. */
  sortableIds?: readonly string[];
  /** Bump after local mutations so the table refetches. */
  version?: number;
  /** Skip fetching while another view owns the page. */
  enabled?: boolean;
}

/**
 * Server-driven data source for the content tables (UI-09): one fetch per
 * sort/filter/search/page change, driven by the URL-synced state of
 * useDataTableState. Pagination meta comes from the response envelope, so
 * DataTablePagination renders server truth instead of client guesses.
 */
export function useContentTableQuery<T>({
  collection,
  state,
  hydrate,
  sortableIds = [],
  version = 0,
  enabled = true,
}: UseContentTableQueryOptions<T>): ContentTableQuery<T> {
  const [rows, setRows] = useState<T[]>([]);
  const [meta, setMeta] = useState<ContentTableMeta>({
    page: 1,
    limit: state.pageSize,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  // Drop stale responses: rapid param changes can interleave fetches.
  const requestIdRef = useRef(0);

  const url = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(state.page));
    params.set("limit", String(state.pageSize));
    const query = state.globalFilter.trim();
    if (query) params.set("search", query);

    const statusFilter = state.columnFilters.find((filter) => filter.id === "status");
    const statusValues = Array.isArray(statusFilter?.value)
      ? (statusFilter!.value as string[])
      : typeof statusFilter?.value === "string" && statusFilter.value
        ? [statusFilter.value]
        : [];
    for (const status of statusValues) params.append("status", status);

    const sort = state.sorting[0];
    if (sort && sortableIds.includes(sort.id)) {
      params.set("sortBy", sort.id);
      params.set("sortOrder", sort.desc ? "desc" : "asc");
    }
    return `/api/v1/content/${collection}?${params.toString()}`;
    // sortableIds is a stable module constant per call site.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    collection,
    state.page,
    state.pageSize,
    state.globalFilter,
    state.columnFilters,
    state.sorting,
  ]);

  useEffect(() => {
    if (!enabled) return;
    const requestId = ++requestIdRef.current;
    let cancelled = false;
    setLoading(true);
    setError(null);

    apiFetch<WireContentItem[]>(url)
      .then((envelope) => {
        if (cancelled || requestId !== requestIdRef.current) return;
        setRows((envelope.data ?? []).map(hydrate));
        setMeta({
          page: envelope.meta?.page ?? state.page,
          limit: envelope.meta?.limit ?? state.pageSize,
          total: envelope.meta?.total ?? 0,
          totalPages: envelope.meta?.totalPages ?? 1,
        });
        setLoading(false);
      })
      .catch((fetchError: unknown) => {
        if (cancelled || requestId !== requestIdRef.current) return;
        setError(fetchError instanceof Error ? fetchError.message : "Failed to load content");
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // hydrate/url carry every dependency that matters; version forces a
    // refetch after mutations that happened outside this hook.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, enabled, version, nonce, hydrate]);

  const refetch = useCallback(() => setNonce((value) => value + 1), []);

  return { rows, total: meta.total, totalPages: meta.totalPages, loading, error, refetch };
}

/**
 * Hydrate a wire row into the domain object the legacy hooks produce, then
 * patch the author avatar from `avatarUrl` — the API field name the legacy
 * hydrators miss (they read `author.image`).
 */
function withAvatar<T extends { author: { avatar?: string } }>(item: T, raw: WireContentItem): T {
  const avatarUrl = raw.author?.avatarUrl;
  if (!avatarUrl) return item;
  return { ...item, author: { ...item.author, avatar: avatarUrl } } as T;
}

export function toArticle(raw: WireContentItem): Article {
  return withAvatar(hydrateArticle(raw as unknown as RawArticleRow), raw);
}

export function toAnnouncement(raw: WireContentItem): Announcement {
  const base = withAvatar(hydrateAnnouncement(raw as unknown as RawAnnouncementRow), raw);
  // The wire keeps isUrgent at the top level; the legacy hydrator reads it
  // from a nested `ui` bag that no longer exists, so patch it here.
  return { ...base, isUrgent: Boolean(raw.isUrgent) };
}

export function toPublication(raw: WireContentItem): Publication {
  return withAvatar(hydratePublication(raw as unknown as RawPublicationRow), raw);
}
