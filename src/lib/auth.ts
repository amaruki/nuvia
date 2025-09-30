import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "./prisma";
import { validatePasswordStrength } from "./utils/password";
import { validateWithSchema } from "./utils/validation-utils";
import { formatDate, getRelativeTime } from "./utils/date-utils";
import { authenticateRequest, authorizeResourceAccess, withAuth, withResourceAuth, authorizeByRole, withRoleAuth } from "./middleware/auth-middleware";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    // Add password validation using our utility
    passwordValidation: (password: string) => {
      const validation = validatePasswordStrength(password);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(", "));
      }
      return true;
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  user: {
    additionalFields: {
      username: {
        type: "string",
        required: true,
        unique: true,
      },
      displayName: {
        type: "string",
        required: false,
      },
      profilePhoto: {
        type: "string",
        required: false,
      },
      bio: {
        type: "string",
        required: false,
      },
      externalLinks: {
        type: "json",
        required: false,
      },
    },
  },
  rateLimit: {
    enabled: true,
    window: 60, // 60 seconds
    max: 100, // 100 requests per window
  },
  plugins: [nextCookies()],
});

// Export password utilities for use in auth actions
export const passwordUtils = {
  validatePasswordStrength,
};

// Export validation utilities for use in auth actions
export const validationUtils = {
  validateWithSchema,
};

// Export date utilities for use in auth actions
export const dateUtils = {
  formatDate,
  getRelativeTime,
};

// Export auth middleware for use in routes and actions
export const authMiddleware = {
  authenticateRequest,
  authorizeResourceAccess,
  withAuth,
  withResourceAuth,
  authorizeByRole,
  withRoleAuth,
};