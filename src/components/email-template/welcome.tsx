import React from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { Tailwind } from "@react-email/tailwind";
import { EmailFooter } from "./shared-footer";
import { EMAIL_TAILWIND_CONFIG } from "./email-theme";

interface WelcomeEmailProps {
  userName?: string;
  dashboardUrl?: string;
  organizationName?: string;
  supportEmail?: string;
}

export function WelcomeEmail({
  userName,
  dashboardUrl = "/dashboard",
  organizationName = "Nuvia",
  supportEmail,
}: WelcomeEmailProps) {
  return (
    <Html>
      <Preview>Welcome to {organizationName}!</Preview>
      <Tailwind config={EMAIL_TAILWIND_CONFIG}>
        {/* Head must sit inside Tailwind so media-query/hover classes can
            be emitted into a <style> tag; outside, rendering throws. */}
        <Head />
        <Body className="bg-muted font-sans">
          <Container className="max-w-lg mx-auto bg-card rounded-lg shadow-lg">
            {/* Logo/Header */}
            <Section className="bg-primary text-primary-foreground p-6 rounded-t-lg">
              <div className="text-center">
                <div className="w-12 h-12 bg-white rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
                    ></path>
                  </svg>
                </div>
                {/* No glyph: the gift-box SVG chip above carries the celebration;
                    lucide SVGs are not safe across email clients (UI-13). */}
                <h1 className="text-2xl font-bold mb-2">Welcome Aboard!</h1>
                <p className="text-primary-foreground">{userName ? `Hi ${userName},` : "Hello,"}</p>
              </div>
            </Section>

            {/* Main Content */}
            <Section className="p-8">
              <Text className="text-foreground leading-6 mb-6">
                Thank you for joining {organizationName}! Your account has been successfully created
                and we're excited to have you with us.
              </Text>

              <div className="text-center my-6">
                <Button
                  href={dashboardUrl}
                  className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium"
                >
                  Get Started
                </Button>
              </div>

              {/* Features */}
              <Section className="bg-muted rounded-lg p-4">
                <h3 className="text-sm font-semibold text-foreground mb-4">What's Next?</h3>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <svg
                      className="w-5 h-5 text-primary mr-3 mt-0.5 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      ></path>
                    </svg>
                    <Text className="text-sm text-muted-foreground">
                      Complete your profile to get personalized recommendations
                    </Text>
                  </div>
                  <div className="flex items-start">
                    <svg
                      className="w-5 h-5 text-primary mr-3 mt-0.5 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      ></path>
                    </svg>
                    <Text className="text-sm text-muted-foreground">
                      Explore our features and discover what you can do
                    </Text>
                  </div>
                  <div className="flex items-start">
                    <svg
                      className="w-5 h-5 text-primary mr-3 mt-0.5 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      ></path>
                    </svg>
                    <Text className="text-sm text-muted-foreground">
                      Connect with our community and get support
                    </Text>
                  </div>
                </div>
              </Section>

              {/* Support */}
              <div className="text-center mt-6">
                <Text className="text-sm text-muted-foreground">
                  Need help?{" "}
                  <Link
                    href={supportEmail ? `mailto:${supportEmail}` : "/support"}
                    className="text-primary font-medium"
                  >
                    Contact our support team
                  </Link>
                </Text>
              </div>
            </Section>

            {/* Footer */}
            <EmailFooter organizationName={organizationName} supportEmail={supportEmail} />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export default WelcomeEmail;
