import { render } from '@react-email/render';
import React from 'react';

/**
 * Renders a React Email component to HTML and plain text
 */
export async function renderEmailTemplate(component: React.ReactElement) {
  try {
    const html = await render(component, {
      pretty: true,
    });

    // Generate plain text version (basic implementation)
    const text = html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim()
      .substring(0, 2000); // Limit text length

    return { html, text };
  } catch (error) {
    console.error('Failed to render email template:', error);
    throw new Error(`Email template rendering failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Email validation utility
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Generate email verification URL with token
 */
export function generateVerificationUrl(token: string, baseUrl?: string): string {
  const base = baseUrl || process.env.APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
  return `${base}/auth/verify-email?token=${token}`;
}

/**
 * Generate password reset URL with token
 */
export function generatePasswordResetUrl(token: string, baseUrl?: string): string {
  const base = baseUrl || process.env.APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
  return `${base}/auth/reset-password?token=${token}`;
}

/**
 * Sanitize email content to prevent XSS
 */
export function sanitizeEmailContent(content: string): string {
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
}