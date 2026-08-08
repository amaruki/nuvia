"use client";

/**
 * D3: learning certificates dashboard hooks backed by the real learning API.
 *
 * react-query over `apiFetch` (same arrangement as use-committees.ts):
 * the list query hydrates wire dates via `toCertificateUi`, and the revoke
 * mutation PATCHes the certificate status and invalidates the shared
 * `["learning", "certificates"]` key.
 */

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import type { Certificate } from "@/types/learning.types";

// ---------------------------------------------------------------------------
// Wire → UI mapping (ISO date strings → display labels)
// ---------------------------------------------------------------------------

/** Wire shape returned by /api/v1/learning/certificates: Certificate with ISO dates. */
export type WireCertificate = Certificate;

const LONG_DATE = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

function formatLongDate(value: string): string | undefined {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : LONG_DATE.format(parsed);
}

/** Hydrates wire ISO dates into the labels the certificate pages render. */
export function toCertificateUi(wire: WireCertificate): Certificate {
  const hydrated: Certificate = { ...wire };
  hydrated.issueDate = formatLongDate(wire.issueDate) ?? "";
  if (wire.expiryDate) {
    hydrated.expiryDate = formatLongDate(wire.expiryDate);
  }
  return hydrated;
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useLearningCertificates() {
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: ["learning", "certificates", "list"],
    queryFn: async () => {
      const { data } = await apiFetch<WireCertificate[]>("/api/v1/learning/certificates?limit=100");
      return data.map(toCertificateUi);
    },
  });

  const invalidateCertificates = () =>
    queryClient.invalidateQueries({ queryKey: ["learning", "certificates"] });

  const revokeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiFetch<WireCertificate>(`/api/v1/learning/certificates/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "revoked" }),
      });
      return toCertificateUi(data);
    },
    onSuccess: () => {
      toast.success("Certificate revoked");
      invalidateCertificates();
    },
    onError: (error) => {
      toast.error(error instanceof ApiClientError ? error.message : "Failed to revoke certificate");
    },
  });

  const certificates = useMemo(() => listQuery.data ?? [], [listQuery.data]);

  const revokeCertificate = async (id: string) => {
    await revokeMutation.mutateAsync(id);
  };

  return {
    certificates,
    loading: listQuery.isPending,
    error: listQuery.error
      ? listQuery.error instanceof ApiClientError
        ? listQuery.error.message
        : "Failed to fetch certificates. Please try again."
      : null,
    revokeCertificate,
    refreshData: invalidateCertificates,
  };
}

/** Single-certificate query for the certificate detail page. */
export function useCertificate(id: string | undefined) {
  return useQuery({
    queryKey: ["learning", "certificates", "detail", id],
    queryFn: async () => {
      const { data } = await apiFetch<WireCertificate>(`/api/v1/learning/certificates/${id}`);
      return toCertificateUi(data);
    },
    enabled: Boolean(id),
  });
}
