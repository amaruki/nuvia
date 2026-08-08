/**
 * Payment service (backlog C3). Split from src/lib/services/payment.service.ts,
 * which stays as a re-export shim so `@/lib/services/payment.service` keeps
 * resolving.
 *
 * Owns payment recording (mutations.ts) and provider-webhook processing
 * (webhook.ts); the invoice aggregate lives in invoice.service.ts (scope
 * split documented there).
 *
 * Money rule (ADR-0015 §5): string-mode numeric(10,2) in and out; integer
 * minor-unit arithmetic only, via toMinorUnits/toAmountString.
 *
 * Audit rule (PRINCIPLES.md "Fast vs. auditable"): privileged mutations
 * write their auth_logs entry in the SAME db.transaction as the row change
 * (audit.ts).
 */

export { listPayments, getPayment } from "./queries";
export { recordPayment } from "./mutations";
export { processGatewayWebhook } from "./webhook";
export type { RecordedPayment, WebhookEventContext, WebhookProcessingResult } from "./types";
