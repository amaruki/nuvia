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

// Environment checks
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';


// Validate Better Auth secret
const BETTER_AUTH_SECRET = process.env.BETTER_AUTH_SECRET;
if (!BETTER_AUTH_SECRET || BETTER_AUTH_SECRET === "your-secret-key-here") {
  console.warn("WARNING: BETTER_AUTH_SECRET is not properly configured.");
  if (isProduction) {
    throw new Error("BETTER_AUTH_SECRET must be set in production environment");
  }
}

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
    if (emailService === 'none' && !isProduction) {
      console.log('📧 Email would be sent (development mode):', {
        to: options.to,
        subject: options.subject,
        text: options.text?.substring(0, 100) + '...',
      });
      return { success: true };
    }

    const from = options.from || EMAIL_CONFIG.FROM;

    if (emailService === 'resend' && resendClient) {
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

export const emailTemplates = {
  passwordReset: async (resetUrl: string, userName?: string) => {
    const component = React.createElement(PasswordResetEmail, { resetUrl, userName });
    const { html, text } = await renderEmailTemplate(component);
    return {
      subject: 'Reset your password',
      html,
      text,
    };
  },

  emailVerification: async (verificationUrl: string, userName?: string) => {
    const component = React.createElement(EmailVerificationEmail, { verificationUrl, userName });
    const { html, text } = await renderEmailTemplate(component);
    return {
      subject: 'Verify your email address',
      html,
      text,
    };
  },

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

export const auth = betterAuth({
  // CRITICAL: Set base URL explicitly
  baseURL: APP_URL,
  basePath: "/api/auth",

  // Secret configuration
  secret: BETTER_AUTH_SECRET || "fallback-secret-for-development",

  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          // Handle username generation for OAuth users
          if (user.username && typeof user.username === 'string') {
            let username = user.username.toLowerCase().replace(/[^a-z0-9_]/g, '');
            let counter = 1;
            let uniqueUsername = username;

            // Check if username exists and generate unique one if needed
            while (await prisma.user.findUnique({
              where: { username: uniqueUsername },
              select: { id: true }
            })) {
              uniqueUsername = `${username}${counter}`;
              counter++;

              // Prevent infinite loop
              if (counter > 9999) {
                uniqueUsername = `${username}_${Date.now()}`;
                break;
              }
            }

            return {
              data: {
                ...user,
                username: uniqueUsername,
              },
            };
          }

          return { data: user };
        },
      },
    },
  },
  
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
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
    onPasswordReset: async ({ user }: { user: { email: string } }) => {
      console.log(`Password for user ${user.email} has been reset.`);
    },
    resetPasswordTokenExpiresIn: 3600,
  },
  
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      enabled: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      // FIXED: Use consistent redirect URI
      redirectUri: `${APP_URL}/api/auth/callback/google`,
      accessType: "offline",
      prompt: "consent",
      scopes: ["openid", "profile", "email"],
      // REMOVED: Let Better Auth handle state management automatically
      mapProfileToUser: (profile) => {
        // Generate username from email if not provided by OAuth provider
        const baseUsername = profile.email?.split('@')[0] || 'user';
        const cleanUsername = baseUsername.toLowerCase().replace(/[^a-z0-9_]/g, '');
        return {
          name: profile.given_name || profile.name,
          email: profile.email,
          image: profile.picture,
          username: cleanUsername,
        };
      }
    },
  },
  
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google"],
    },
  },
  
  // FIXED: Session cookie configuration based on environment
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieOptions: {
      secure: isProduction, // true in production, false in development
      sameSite: isProduction ? "none" : "lax", // "none" requires secure=true
      httpOnly: true,
      path: "/",
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
    window: 60,
    max: 100,
  },
  
  verification: {
    disableCleanup: false,
    expiresIn: 300, // 5 minutes
  },
  
  plugins: [nextCookies()],
  
  // FIXED: Advanced configuration with environment-aware settings
  advanced: {
    useSecureCookies: isProduction,
    cookieOptions: {
      sameSite: isProduction ? "none" : "lax",
      secure: isProduction,
      httpOnly: true,
      path: "/",
    },
    cookiePrefix: "nuvia-auth",
    // FIXED: Only include current origin in trusted origins
    trustedOrigins: isProduction 
      ? [APP_URL]
      : [
          APP_URL,
          "http://localhost:3000",
          "http://localhost:3001",
        ],
    generateState: true,
    stateOptions: {
      maxAge: 600, // 10 minutes
      sameSite: isProduction ? "none" : "lax",
      path: "/",
      httpOnly: true,
      secure: isProduction,
    },
    hooks: {
      onError: async (event: any) => {
        console.error("Better Auth Error:", {
          event: event.name,
          error: event.error?.message || event.error,
          context: event.context,
          stack: isDevelopment ? event.error?.stack : undefined,
        });
      },
      beforeOAuthStart: async (event: any) => {
        if (isDevelopment) {
          console.log("Starting OAuth Flow:", {
            provider: event.provider,
            state: event.state,
            timestamp: new Date().toISOString(),
          });
        }
      },
      onOAuthAccountCreation: async (event: any) => {
        console.log("OAuth Account Creation:", {
          provider: event.provider,
          email: event.email,
          timestamp: new Date().toISOString(),
        });
      },
      onOAuthSignIn: async (event: any) => {
        console.log("OAuth Sign In:", {
          provider: event.provider,
          email: event.email,
          timestamp: new Date().toISOString(),
        });
      },
      beforeOAuthCallback: async (event: any) => {
        if (isDevelopment) {
          console.log("Before OAuth Callback:", {
            provider: event.provider,
            state: event.state,
            query: event.query,
            timestamp: new Date().toISOString(),
          });
        }
      },
    }
  },
  
  logger: {
    level: isDevelopment ? "debug" : "warn",
    disabled: isProduction,
  },
  
  onError: (error: any) => {
    console.error("Better Auth Error:", error?.message || error);
  },
});

export const passwordUtils = {
  validatePasswordStrength,
};