import React from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { Tailwind } from "@react-email/tailwind";
import { EmailFooter } from "./shared-footer";
import { EMAIL_TAILWIND_CONFIG } from "./email-theme";

interface PasswordResetEmailProps {
  resetUrl: string;
  userName?: string;
  organizationName?: string;
  supportEmail?: string;
}

export function PasswordResetEmail({
  resetUrl,
  userName,
  organizationName = "Nuvia",
  supportEmail,
}: PasswordResetEmailProps) {
  return (
    <Html>
      <Preview>Reset your password</Preview>
      <Tailwind config={EMAIL_TAILWIND_CONFIG}>
        {/* Head must sit inside Tailwind so media-query/hover classes can
            be emitted into a <style> tag; outside, rendering throws. */}
        <Head />
        <Body className="bg-muted font-sans">
          <Container className="max-w-lg mx-auto bg-card rounded-lg shadow-lg">
            {/* Logo/Header */}
            <Section className="bg-info text-white p-6 rounded-t-lg">
              <div className="text-center">
                <div className="w-12 h-12 bg-white rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-info"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                    ></path>
                  </svg>
                </div>
                <h1 className="text-2xl font-bold mb-2">Password Reset Request</h1>
                <p className="text-white">{userName ? `Hi ${userName},` : "Hello,"}</p>
              </div>
            </Section>

            {/* Main Content */}
            <Section className="p-8">
              <Text className="text-foreground leading-6 mb-6">
                We received a request to reset your password. Click the button below to reset it:
              </Text>

              <div className="text-center my-6">
                <Button
                  href={resetUrl}
                  className="bg-info text-white px-6 py-3 rounded-lg font-medium"
                >
                  Reset Password
                </Button>
              </div>

              {/* Security Notice */}
              <Section className="bg-muted rounded-lg p-4">
                <h3 className="text-sm font-semibold text-foreground mb-2">Security Notice</h3>
                <Text className="text-sm text-muted-foreground leading-5">
                  • If you didn't request this password reset, you can safely ignore this email.
                  <br />• This link will expire in 1 hour for security reasons.
                  <br />• Never share this link with anyone.
                </Text>
              </Section>
            </Section>

            {/* Footer */}
            <EmailFooter organizationName={organizationName} supportEmail={supportEmail} />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export default PasswordResetEmail;
