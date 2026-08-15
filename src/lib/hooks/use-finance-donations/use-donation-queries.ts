"use client";

import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api-client";

import {
  DONATIONS_API_PATH,
  DONATIONS_QUERY_KEY,
  DONATIONS_WINDOW_QUERY_KEY,
  STATISTICS_WINDOW_LIMIT,
} from "./constants";
import { hydrateDonation } from "./hydrate-donation";
import type { DonationWireRow } from "./types";

/** Pagination metadata returned by the donations list endpoint. */
export interface DonationListMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** Server pagination params for the donations table query. */
export interface DonationListParams {
  page: number;
  pageSize: number;
}

/**
 * Donations table list: one server-paginated page, hydrated client-side.
 * Page and page size come from the URL-synced table state, so the full
 * list is reachable — no silent row cap.
 */
export function useDonationsQuery({ page, pageSize }: DonationListParams) {
  return useQuery({
    queryKey: [...DONATIONS_QUERY_KEY, { page, pageSize }],
    queryFn: async () => {
      const { data } = await apiFetch<{ donations: DonationWireRow[]; meta: DonationListMeta }>(
        `${DONATIONS_API_PATH}?page=${page}&limit=${pageSize}`,
      );
      return { donations: data.donations.map(hydrateDonation), meta: data.meta };
    },
  });
}

/**
 * Bounded aggregate window for statistics and the overview cards. Fixed at
 * the newest STATISTICS_WINDOW_LIMIT rows — the list endpoint caps `limit`
 * at 100 — while the table above paginates over the full list. See
 * STATISTICS_WINDOW_LIMIT for the stated cap.
 */
export function useDonationsWindowQuery() {
  return useQuery({
    queryKey: DONATIONS_WINDOW_QUERY_KEY,
    queryFn: async () => {
      const { data } = await apiFetch<{ donations: DonationWireRow[] }>(
        `${DONATIONS_API_PATH}?page=1&limit=${STATISTICS_WINDOW_LIMIT}`,
      );
      return data.donations.map(hydrateDonation);
    },
  });
}

/**
 * One donation for the edit sheet (`?form=<id>`). Disabled while `id` is
 * null so the create mode never fires it.
 */
export function useDonationQuery(id: string | null) {
  return useQuery({
    queryKey: [...DONATIONS_QUERY_KEY, "detail", id],
    queryFn: async () => {
      const { data } = await apiFetch<{ donation: DonationWireRow }>(`${DONATIONS_API_PATH}/${id}`);
      return hydrateDonation(data.donation);
    },
    enabled: id !== null,
  });
}
