import nodemailer from "nodemailer";
import { EMAIL_CONFIG, APP_URL, FEATURES } from "@/lib/config";
import { logError } from "@/lib/errors";

/**
 * Email service for sending various types of emails
 */
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Create a transporter object using SMTP transport
    this.transporter = nodemailer.createTransport({
      host: EMAIL_CONFIG.HOST,
      port: EMAIL_CONFIG.PORT,
      secure: EMAIL_CONFIG.PORT === 465, // true for 465, false for other ports
      auth: {
        user: EMAIL_CONFIG.USER,
        pass: EMAIL_CONFIG.PASS,
      },
    });
  }

  /**
   * Send a password reset email
   * @param to - Recipient email address
   * @param resetToken - Password reset token
   * @param username - User's username
   * @returns Promise that resolves when the email is sent
   */
  async sendPasswordResetEmail(to: string, resetToken: string, username: string): Promise<void> {
    if (!FEATURES.EMAIL_VERIFICATION) {
      console.log("Email verification is disabled. Skipping password reset email.");
      return;
    }

    const resetUrl = `${APP_URL}/auth/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: EMAIL_CONFIG.FROM,
      to,
      subject: "Reset Your Password",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>Hello ${username},</p>
          <p>We received a request to reset your password for your account. If you made this request, please click the button below to set a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Reset Password</a>
          </div>
          <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
          <p>This link will expire in 1 hour for security reasons.</p>
          <p>Thank you,<br>The Team</p>
          <hr style="margin-top: 30px; border: none; border-top: 1px solid #eee;">
          <p style="font-size: 12px; color: #777;">If you're having trouble clicking the "Reset Password" button, copy and paste the following URL into your web browser:</p>
          <p style="font-size: 12px; color: #777; word-break: break-all;">${resetUrl}</p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Password reset email sent to ${to}`);
    } catch (error) {
      logError(error as Error, {
        service: "email",
        type: "password_reset",
        recipient: to,
      });
      throw new Error("Failed to send password reset email");
    }
  }

  /**
   * Send an email verification email
   * @param to - Recipient email address
   * @param verificationToken - Email verification token
   * @param username - User's username
   * @returns Promise that resolves when the email is sent
   */
  async sendEmailVerificationEmail(
    to: string,
    verificationToken: string,
    username: string,
  ): Promise<void> {
    if (!FEATURES.EMAIL_VERIFICATION) {
      console.log("Email verification is disabled. Skipping email verification email.");
      return;
    }

    const verificationUrl = `${APP_URL}/auth/verify-email?token=${verificationToken}`;

    const mailOptions = {
      from: EMAIL_CONFIG.FROM,
      to,
      subject: "Verify Your Email Address",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Verify Your Email Address</h2>
          <p>Hello ${username},</p>
          <p>Thank you for creating an account with us. To complete your registration, please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Verify Email</a>
          </div>
          <p>If you didn't create an account with us, please ignore this email.</p>
          <p>This link will expire in 24 hours for security reasons.</p>
          <p>Thank you,<br>The Team</p>
          <hr style="margin-top: 30px; border: none; border-top: 1px solid #eee;">
          <p style="font-size: 12px; color: #777;">If you're having trouble clicking the "Verify Email" button, copy and paste the following URL into your web browser:</p>
          <p style="font-size: 12px; color: #777; word-break: break-all;">${verificationUrl}</p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Email verification email sent to ${to}`);
    } catch (error) {
      logError(error as Error, {
        service: "email",
        type: "email_verification",
        recipient: to,
      });
      throw new Error("Failed to send email verification email");
    }
  }

  /**
   * Send a login notification email
   * @param to - Recipient email address
   * @param username - User's username
   * @param deviceInfo - Information about the device used to log in
   * @param location - Location of the login
   * @param time - Time of the login
   * @returns Promise that resolves when the email is sent
   */
  async sendLoginNotificationEmail(
    to: string,
    username: string,
    deviceInfo: { deviceName: string; deviceType: string; ipAddress: string },
    location: string,
    time: string,
  ): Promise<void> {
    if (!FEATURES.EMAIL_VERIFICATION) {
      console.log("Email verification is disabled. Skipping login notification email.");
      return;
    }

    const mailOptions = {
      from: EMAIL_CONFIG.FROM,
      to,
      subject: "New Login to Your Account",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">New Login Detected</h2>
          <p>Hello ${username},</p>
          <p>We detected a new login to your account:</p>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <p><strong>Device:</strong> ${deviceInfo.deviceName} (${deviceInfo.deviceType})</p>
            <p><strong>IP Address:</strong> ${deviceInfo.ipAddress}</p>
            <p><strong>Location:</strong> ${location}</p>
            <p><strong>Time:</strong> ${time}</p>
          </div>
          <p>If this was you, no action is needed. If you don't recognize this login, please secure your account immediately:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${APP_URL}/dashboard/active-devices" style="background-color: #EF4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Secure Your Account</a>
          </div>
          <p>Thank you,<br>The Team</p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Login notification email sent to ${to}`);
    } catch (error) {
      logError(error as Error, {
        service: "email",
        type: "login_notification",
        recipient: to,
      });
      // Don't throw an error for login notifications as they're not critical
    }
  }

  /**
   * Send an account deletion confirmation email
   * @param to - Recipient email address
   * @param username - User's username
   * @returns Promise that resolves when the email is sent
   */
  async sendAccountDeletionEmail(to: string, username: string): Promise<void> {
    if (!FEATURES.EMAIL_VERIFICATION) {
      console.log("Email verification is disabled. Skipping account deletion email.");
      return;
    }

    const mailOptions = {
      from: EMAIL_CONFIG.FROM,
      to,
      subject: "Your Account Has Been Deleted",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Account Deletion Confirmation</h2>
          <p>Hello ${username},</p>
          <p>We're writing to confirm that your account has been successfully deleted as requested.</p>
          <p>All your personal data has been permanently removed from our systems in accordance with our privacy policy.</p>
          <p>If you change your mind in the future, you're always welcome to create a new account with us.</p>
          <p>Thank you for being part of our community. We hope to see you again soon!</p>
          <p>Best regards,<br>The Team</p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Account deletion email sent to ${to}`);
    } catch (error) {
      logError(error as Error, {
        service: "email",
        type: "account_deletion",
        recipient: to,
      });
      // Don't throw an error for account deletion emails as the account is already deleted
    }
  }

  /**
   * Test the email configuration
   * @returns Promise that resolves when the test email is sent
   */
  async testEmailConfiguration(): Promise<void> {
    const mailOptions = {
      from: EMAIL_CONFIG.FROM,
      to: EMAIL_CONFIG.FROM, // Send to self for testing
      subject: "Email Configuration Test",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Email Configuration Test</h2>
          <p>If you're reading this, your email configuration is working correctly!</p>
          <p>Timestamp: ${new Date().toISOString()}</p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log("Email configuration test successful");
    } catch (error) {
      logError(error as Error, {
        service: "email",
        type: "configuration_test",
      });
      throw new Error("Email configuration test failed");
    }
  }
}

// Create a singleton instance of the email service
export const emailService = new EmailService();
