"use server";

import { clientSafeAuthMessage } from "@/lib/auth/common";
import { logger } from "@/lib/logger";
import type { PasswordResetResponse } from "@/types/auth.types";

/**
 * Server action to delete user account
 */
export async function deleteAccountAction(): Promise<PasswordResetResponse> {
  try {
    logger.info("Account deletion attempt");

    return {
      success: true,
      message: "Account deletion functionality is being refactored. Please check back soon.",
    };
  } catch (error) {
    return {
      success: false,
      message: clientSafeAuthMessage(error, "Account deletion failed"),
    };
  }
}
