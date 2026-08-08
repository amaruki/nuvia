"use client";

/**
 * C4: gateways dashboard hook backed by GET /api/v1/finance/gateways.
 *
 * Exactly one gateway exists — the one selected by the PAYMENT_GATEWAY
 * deployment env (docs/adr/0015). There is no gateway CRUD: no add, edit,
 * delete, enable/disable or test-connection actions exist, and this hook
 * does not invent them.
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, ApiClientError } from "@/lib/api-client";

/** Wire shape of src/lib/services/finance-report.service.ts ConfiguredGatewayStatus. */
export interface ConfiguredGateway {
  provider: "manual" | "stripe";
  displayName: string;
  status: "active";
  description: string;
  webhookEndpoint: string | null;
  secretKeyConfigured: boolean | null;
  webhookSecretConfigured: boolean | null;
}

export function useFinanceGateways() {
  const queryClient = useQueryClient();

  const gatewayQuery = useQuery({
    queryKey: ["finance", "gateways"],
    queryFn: async () => {
      const { data } = await apiFetch<{ gateway: ConfiguredGateway }>("/api/v1/finance/gateways");
      return data.gateway;
    },
  });

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ["finance", "gateways"] });
  };

  return {
    gateway: gatewayQuery.data ?? null,
    loading: gatewayQuery.isPending,
    error: gatewayQuery.error
      ? gatewayQuery.error instanceof ApiClientError
        ? gatewayQuery.error.message
        : "Failed to load the configured payment gateway"
      : null,
    refreshData,
  };
}
