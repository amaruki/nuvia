/**
 * Email delivery for auth flows: provider-agnostic EmailService
 * (Resend/Nodemailer) plus the transactional templates used by the
 * password-reset and email-verification token flows (see ./tokens.ts).
 *
 * Split out of the old monolithic src/lib/auth.ts.
 */

import React from "react";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { renderEmailTemplate } from "../email-utils";
import { getOrganization } from "@/lib/services/organization.service";
import PasswordResetEmail from "@/components/email-template/password-reset";
import EmailVerificationEmail from "@/components/email-template/email-verification";
import WelcomeEmail from "@/components/email-template/welcome";
import { isProduction } from "./helpers";

/**
 * Email service types
 */
type EmailServiceType = "resend" | "nodemailer" | "none";

/**
 * Email service configuration class
 */
class EmailService {
  private service: EmailServiceType = "none";
  private resendClient: any = null;
  private nodemailerTransporter: any = null;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    // Initialize Resend if available
    if (process.env.RESEND_API_KEY) {
      this.service = "resend";
      try {
        const { Resend } = await import("resend");
        this.resendClient = new Resend(process.env.RESEND_API_KEY);
        logger.info("✅ Resend email service initialized");
      } catch (error) {
        logger.warn("❌ Failed to initialize Resend", error);
        this.service = "none";
      }
    }
    // Initialize Nodemailer if available
    else if (env.EMAIL_HOST && env.EMAIL_USER && env.EMAIL_PASS) {
      this.service = "nodemailer";
      try {
        const { createTransport } = await import("nodemailer");
        this.nodemailerTransporter = createTransport({
          host: env.EMAIL_HOST,
          port: env.EMAIL_PORT,
          secure: env.EMAIL_PORT === 465,
          auth: {
            user: env.EMAIL_USER,
            pass: env.EMAIL_PASS,
          },
        });
        logger.info("✅ Nodemailer email service initialized");
      } catch (error) {
        logger.warn("❌ Failed to initialize Nodemailer", error);
        this.service = "none";
      }
    }
    // No email service configured
    else {
      logger.warn("⚠️ No email service configured. Email functionality will be disabled.");
    }
  }

  /**
   * Send an email using the configured service
   */
  async sendEmail(options: {
    to: string | string[];
    subject: string;
    text?: string;
    html?: string;
    from?: string;
    replyTo?: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      // Development mode fallback
      if (this.service === "none" && !isProduction) {
        logger.info("📧 Email would be sent (development mode)", {
          to: options.to,
          subject: options.subject,
          textPreview: options.text?.substring(0, 100) + "...",
        });
        return { success: true };
      }

      const from = options.from || env.EMAIL_FROM;

      if (this.service === "resend" && this.resendClient) {
        const { data, error } = await this.resendClient.emails.send({
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

        logger.info("✅ Email sent via Resend", data);
        return { success: true };
      }

      if (this.service === "nodemailer" && this.nodemailerTransporter) {
        const mailOptions = {
          from,
          to: options.to,
          subject: options.subject,
          text: options.text,
          html: options.html,
          replyTo: options.replyTo,
        };

        const result = await this.nodemailerTransporter.sendMail(mailOptions);
        logger.info("✅ Email sent via Nodemailer", result.messageId);
        return { success: true };
      }

      throw new Error("No email service is properly configured");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown email error";
      logger.error("❌ Failed to send email", errorMessage);
      return { success: false, error: errorMessage };
    }
  }
}

// Initialize email service
export const emailService = new EmailService();

/**
 * Email templates factory
 */
export const emailTemplates = {
  passwordReset: async (resetUrl: string, userName?: string) => {
    const organization = await getOrganization();
    const component = React.createElement(PasswordResetEmail, {
      resetUrl,
      userName,
      organizationName: organization.name,
      supportEmail: organization.supportEmail ?? undefined,
    });
    const { html, text } = await renderEmailTemplate(component);
    return {
      subject: `Reset your ${organization.name} password`,
      html,
      text,
    };
  },

  emailVerification: async (verificationUrl: string, userName?: string) => {
    const organization = await getOrganization();
    const component = React.createElement(EmailVerificationEmail, {
      verificationUrl,
      userName,
      organizationName: organization.name,
      supportEmail: organization.supportEmail ?? undefined,
    });
    const { html, text } = await renderEmailTemplate(component);
    return {
      subject: `Verify your ${organization.name} email address`,
      html,
      text,
    };
  },

  welcome: async (userName?: string) => {
    const organization = await getOrganization();
    const component = React.createElement(WelcomeEmail, {
      userName,
      dashboardUrl: `${env.APP_URL}/dashboard`,
      organizationName: organization.name,
      supportEmail: organization.supportEmail ?? undefined,
    });
    const { html, text } = await renderEmailTemplate(component);
    return {
      subject: `Welcome to ${organization.name}!`,
      html,
      text,
    };
  },
};
