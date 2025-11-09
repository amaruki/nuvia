import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "./prisma";
import { validatePasswordStrength } from "./utils/password";
import { SOCIAL_PROVIDERS, FEATURES, APP_URL, EMAIL_CONFIG } from "./config";
import { renderEmailTemplate } from "./email-utils";
import PasswordResetEmail from "@/components/email-template/password-reset";
import EmailVerificationEmail from "@/components/email-template/email-verification";
import WelcomeEmail from "@/components/email-template/welcome";
import React from 'react';

// Email service integration
let emailService: 'resend' | 'nodemailer' | 'none' = 'none';
let resendClient: any = null;
let nodemailerTransporter: any = null;

// Initialize email service based on configuration
if (process.env.RESEND_API_KEY) {
  emailService = 'resend';
  import('resend').then(({ Resend }) => {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }).catch(() => {
    console.warn('Failed to initialize Resend email service');
  });
} else if (EMAIL_CONFIG.HOST && EMAIL_CONFIG.USER && EMAIL_CONFIG.PASS) {
  emailService = 'nodemailer';
  import('nodemailer').then(({ createTransport }) => {
    nodemailerTransporter = createTransport({
      host: EMAIL_CONFIG.HOST,
      port: EMAIL_CONFIG.PORT,
      secure: EMAIL_CONFIG.PORT === 465,
      auth: {
        user: EMAIL_CONFIG.USER,
        pass: EMAIL_CONFIG.PASS,
      },
    });
  }).catch(() => {
    console.warn('Failed to initialize Nodemailer email service');
  });
} else {
  console.warn('No email service configured. Email functionality will be disabled.');
}

/**
 * Send an email using the configured email service
 */
interface SendEmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  replyTo?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<{ success: boolean; error?: string }> {
  try {
    // Skip email sending in development/test environment if no service is configured
    if (emailService === 'none' && process.env.NODE_ENV !== 'production') {
      console.log('📧 Email would be sent (development mode):', {
        to: options.to,
        subject: options.subject,
        text: options.text?.substring(0, 100) + '...',
      });
      return { success: true };
    }

    const from = options.from || EMAIL_CONFIG.FROM;

    if (emailService === 'resend' && resendClient) {
      // Use Resend for email delivery
      const { data, error } = await resendClient.emails.send({
        from,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        text: options.text,
        html: options.html,
        replyTo: options.replyTo,
      });

      if (error) {
        throw new Error(`Resend error: ${error.message}`);
      }

      console.log('✅ Email sent via Resend:', data);
      return { success: true };

    } else if (emailService === 'nodemailer' && nodemailerTransporter) {
      // Use Nodemailer for email delivery
      const mailOptions = {
        from,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        replyTo: options.replyTo,
      };

      const result = await nodemailerTransporter.sendMail(mailOptions);
      console.log('✅ Email sent via Nodemailer:', result.messageId);
      return { success: true };

    } else {
      throw new Error('No email service is properly configured');
    }

  } catch (error) {
    console.error('❌ Failed to send email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown email error'
    };
  }
}

/**
 * Email template functions that use React Email components
 */
export const emailTemplates = {
  /**
   * Password reset email template
   */
  passwordReset: async (resetUrl: string, userName?: string) => {
    const component = React.createElement(PasswordResetEmail, { resetUrl, userName });
    const { html, text } = await renderEmailTemplate(component);

    return {
      subject: 'Reset your password',
      html,
      text,
    };
  },

  /**
   * Email verification template
   */
  emailVerification: async (verificationUrl: string, userName?: string) => {
    const component = React.createElement(EmailVerificationEmail, { verificationUrl, userName });
    const { html, text } = await renderEmailTemplate(component);

    return {
      subject: 'Verify your email address',
      html,
      text,
    };
  },

  /**
   * Welcome email template
   */
  welcome: async (userName?: string) => {
    const component = React.createElement(WelcomeEmail, { userName, dashboardUrl: `${APP_URL}/dashboard` });
    const { html, text } = await renderEmailTemplate(component);

    return {
      subject: 'Welcome to our platform!',
      html,
      text,
    };
  },
};

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
    sendResetPassword: async ({ user, url }) => {
      const template = await emailTemplates.passwordReset(url, user.name || user.email);
      const result = await sendEmail({
        to: user.email,
        subject: template.subject,
        text: template.text,
        html: template.html,
      });

      if (!result.success) {
        console.error('Failed to send password reset email:', result.error);
        throw new Error('Failed to send password reset email');
      }
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

