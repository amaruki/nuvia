import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "./prisma";
import { validatePasswordStrength } from "./utils/password";
import { SOCIAL_PROVIDERS, FEATURES, APP_URL } from "./config";

// Validate Better Auth secret is properly configured
const BETTER_AUTH_SECRET = process.env.BETTER_AUTH_SECRET;
if (!BETTER_AUTH_SECRET || BETTER_AUTH_SECRET === "your-secret-key-here") {
  console.warn("WARNING: BETTER_AUTH_SECRET is not properly configured. Please set a secure secret in your environment variables.");
  if (process.env.NODE_ENV === "production") {
    throw new Error("BETTER_AUTH_SECRET must be set in production environment");
  }
}

export const auth = betterAuth({
  baseURL: APP_URL,
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
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      enabled: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      redirectUri: `${APP_URL}/api/auth/callback/google`,
      prompt: "select_account consent",
      scopes: ["openid", "profile", "email"],
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
      enabled: !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
      redirectUri: `${APP_URL}/api/auth/callback/github`,
      scopes: ["user:email", "read:user"],
    },
    linkedin: {
      clientId: process.env.LINKEDIN_CLIENT_ID || "",
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET || "",
      enabled: !!(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET),
      redirectUri: `${APP_URL}/api/auth/callback/linkedin`,
      scopes: ["openid", "profile", "email"],
    },
  },
  // Ensure account creation is enabled for OAuth providers
  account: {
    accountLinking: {
      enabled: true,
      // Allow users to link multiple OAuth accounts to the same email
      trustedProviders: ["google", "github", "linkedin"],
    },
  },
  // Configure OAuth account creation
  oauth: {
    enabled: true,
    // Automatically create accounts for OAuth users
    createAccountOnSignIn: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
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
  // Add secret for Better Auth
  secret: BETTER_AUTH_SECRET || "fallback-secret-for-development",
  // Add advanced configuration for cookies and state management
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
    cookieOptions: {
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      path: "/",
    },
    cookiePrefix: "nuvia-auth",
    trustedOrigins: [
      APP_URL,
      new URL(APP_URL).origin,
      "http://localhost:3000",
      "https://localhost:3000",
    ],
    generateState: true,
    // Add hooks for debugging OAuth state and handling account creation
    hooks: {
      onError: async (event: any) => {
        console.error("Better Auth Error:", {
          event: event.name,
          error: event.error,
        });
      },
      // Hook to handle OAuth account creation
      onOAuthAccountCreation: async (event: any) => {
        console.log("OAuth Account Creation:", {
          provider: event.provider,
          email: event.email,
          accountId: event.accountId,
        });
        
        // The account will be automatically created by better-auth
        // This hook is just for logging and potential additional processing
      },
      // Hook to handle OAuth sign-in
      onOAuthSignIn: async (event: any) => {
        console.log("OAuth Sign In:", {
          provider: event.provider,
          email: event.email,
          userId: event.userId,
        });
      },
    }
  },
   logger: {
    level: process.env.NODE_ENV === "development" ? "debug" : "warn",
    disabled: process.env.NODE_ENV === "production",
  },
  onError: (error: any) => {
    console.error("Better Auth Error:", error?.message || error);
  },
});

// Export password utilities for use in auth actions
export const passwordUtils = {
  validatePasswordStrength,
};

