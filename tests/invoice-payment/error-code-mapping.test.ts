/**
 * Backlog C3 — the C3 error codes' RFC 9457 problem mapping.
 * One part of the split tests/invoice-payment.test.ts.
 */

import { describe, expect, test } from "bun:test";
import { problemFromFinanceError } from "@/app/api/v1/finance/_lib/helpers";
import { BusinessLogicError, NotFoundError } from "@/lib/errors";

describe("C3 error codes map to RFC 9457 problems", () => {
  test("state collisions answer 409, other business errors 400, missing rows 404", () => {
    expect(
      problemFromFinanceError(new BusinessLogicError("x", "OVERPAYMENT_NOT_ALLOWED"), "t").status,
    ).toBe(409);
    expect(
      problemFromFinanceError(new BusinessLogicError("x", "INVOICE_NOT_PAYABLE"), "t").status,
    ).toBe(409);
    expect(
      problemFromFinanceError(new BusinessLogicError("x", "INVOICE_NOT_VOIDABLE"), "t").status,
    ).toBe(409);
    expect(problemFromFinanceError(new BusinessLogicError("x", "SOMETHING_ELSE"), "t").status).toBe(
      400,
    );
    expect(problemFromFinanceError(new NotFoundError("Invoice", "id"), "t").status).toBe(404);
  });
});
