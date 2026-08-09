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

interface EmailVerificationProps {
  verificationUrl: string;
  userName?: string;
  organizationName?: string;
  supportEmail?: string;
}

export function EmailVerificationEmail({
  verificationUrl,
  userName,
  organizationName = "Nuvia",
  supportEmail,
}: EmailVerificationProps) {
  return (
    <Html>
      <Preview>Verify your email address</Preview>
      <Tailwind config={EMAIL_TAILWIND_CONFIG}>
        {/* Head must sit inside Tailwind so media-query/hover classes can
            be emitted into a <style> tag; outside, rendering throws. */}
        <Head />
        <Body className="bg-muted font-sans">
          <Container className="max-w-lg mx-auto bg-card rounded-lg shadow-lg">
            {/* Logo/Header */}
            <Section className="bg-success text-white p-6 rounded-t-lg">
              <div className="text-center">
                <div className="w-12 h-12 bg-white rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-success"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                  </svg>
                </div>
                <h1 className="text-2xl font-bold mb-2">Verify Your Email</h1>
                <p className="text-white">{userName ? `Welcome ${userName}!` : "Welcome!"}</p>
              </div>
            </Section>

            {/* Main Content */}
            <Section className="p-8">
              <Text className="text-foreground leading-6 mb-6">
                Please click the button below to verify your email address and complete your
                registration:
              </Text>

              <div className="text-center my-6">
                <Button
                  href={verificationUrl}
                  className="bg-success text-white px-6 py-3 rounded-lg font-medium"
                >
                  Verify Email
                </Button>
              </div>

              {/* Instructions */}
              <Section className="bg-muted rounded-lg p-4">
                <h3 className="text-sm font-semibold text-foreground mb-2">Getting Started</h3>
                <Text className="text-sm text-muted-foreground leading-5">
                  • Click the verification button above to activate your account
                  <br />• You'll be redirected to our platform once verified
                  <br />• If you didn't create this account, you can safely ignore this email
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

export default EmailVerificationEmail;
