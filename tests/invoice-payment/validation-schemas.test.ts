/**
 * Backlog C3 — the C3 validation schemas and the minor-unit conversion
 * helper. One part of the split tests/invoice-payment.test.ts.
 */

import { describe, expect, test } from "bun:test";
import { toMinorUnits } from "@/lib/payments/gateway";
import {
  createInvoiceSchema,
  invoiceListQuerySchema,
  recordPaymentSchema,
} from "@/lib/validation/finance.validation";

describe("C3 validation schemas", () => {
  test("recordPaymentSchema requires a money amount", () => {
    expect(recordPaymentSchema.safeParse({ invoiceId: "i", amount: "12.00" }).success).toBe(true);
    expect(recordPaymentSchema.safeParse({ invoiceId: "i", amount: "abc" }).success).toBe(false);
    expect(recordPaymentSchema.safeParse({ invoiceId: "", amount: "1.00" }).success).toBe(false);
  });

  test("createInvoiceSchema defaults item quantity to 1", () => {
    const parsed = createInvoiceSchema.safeParse({
      subscriptionId: "sub-1",
      items: [{ description: "Dues", unitPrice: "12.00" }],
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.items?.[0].quantity).toBe(1);
    }
  });

  test("list queries coerce page/limit strings", () => {
    const parsed = invoiceListQuerySchema.safeParse({ page: "2", limit: "50", status: "PAID" });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.page).toBe(2);
      expect(parsed.data.limit).toBe(50);
      expect(parsed.data.status).toBe("PAID");
    }
    expect(invoiceListQuerySchema.safeParse({ limit: "500" }).success).toBe(false);
  });

  test("toMinorUnits stays exact across the adapter boundary", () => {
    expect(toMinorUnits("60.07")).toBe(6007);
    expect(toMinorUnits("0.10")).toBe(10);
  });
});
