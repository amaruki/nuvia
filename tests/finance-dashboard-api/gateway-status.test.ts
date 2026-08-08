/**
 * Backlog C4 split — gateway status of the finance dashboard's read-only
 * reporting service (describeConfiguredGateway).
 *
 * Pure environment read: no database rows are created, so this file needs
 * no fixture, baseline, or cleanup.
 */

import { describe, expect, test } from "bun:test";
import { env } from "@/lib/env";
import { describeConfiguredGateway } from "@/lib/services/finance-report.service";

describe("describeConfiguredGateway", () => {
  test("mirrors the deployment env without leaking credential values", () => {
    const gateway = describeConfiguredGateway();

    expect(gateway.provider).toBe(env.PAYMENT_GATEWAY);
    expect(gateway.status).toBe("active");
    expect(gateway.displayName.length).toBeGreaterThan(0);

    const serialized = JSON.stringify(gateway);
    if (env.PAYMENT_GATEWAY === "stripe") {
      expect(gateway.webhookEndpoint).toBe("/api/v1/webhooks/stripe");
      expect(typeof gateway.secretKeyConfigured).toBe("boolean");
      expect(typeof gateway.webhookSecretConfigured).toBe("boolean");
      if (env.STRIPE_SECRET_KEY) expect(serialized).not.toContain(env.STRIPE_SECRET_KEY);
      if (env.STRIPE_WEBHOOK_SECRET) {
        expect(serialized).not.toContain(env.STRIPE_WEBHOOK_SECRET);
      }
    } else {
      expect(gateway.webhookEndpoint).toBeNull();
      expect(gateway.secretKeyConfigured).toBeNull();
      expect(gateway.webhookSecretConfigured).toBeNull();
    }
  });
});
