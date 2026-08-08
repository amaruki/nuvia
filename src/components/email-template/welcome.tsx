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

interface WelcomeEmailProps {
  userName?: string;
  dashboardUrl?: string;
}

export function WelcomeEmail({ userName, dashboardUrl = "/dashboard" }: WelcomeEmailProps) {
  return (
    <Html>
      <Preview>Welcome to our platform!</Preview>
      <Tailwind>
        {/* Head must sit inside Tailwind so media-query/hover classes can
            be emitted into a <style> tag; outside, rendering throws. */}
        <Head />
        <Body className="bg-gray-50 font-sans">
          <Container className="max-w-lg mx-auto bg-white rounded-lg shadow-lg">
            {/* Logo/Header */}
            <Section className="bg-purple-600 text-white p-6 rounded-t-lg">
              <div className="text-center">
                <div className="w-12 h-12 bg-white rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-purple-600"
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
                <h1 className="text-2xl font-bold mb-2">Welcome Aboard! 🎉</h1>
                <p className="text-purple-100">{userName ? `Hi ${userName},` : "Hello,"}</p>
              </div>
            </Section>

            {/* Main Content */}
            <Section className="p-8">
              <Text className="text-gray-700 leading-6 mb-6">
                Thank you for joining our platform! Your account has been successfully created and
                we're excited to have you with us.
              </Text>

              <div className="text-center my-6">
                <Button
                  href={dashboardUrl}
                  className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700"
                >
                  Get Started
                </Button>
              </div>

              {/* Features */}
              <Section className="bg-purple-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">What's Next?</h3>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <svg
                      className="w-5 h-5 text-purple-600 mr-3 mt-0.5 flex-shrink-0"
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
                    <Text className="text-sm text-gray-600">
                      Complete your profile to get personalized recommendations
                    </Text>
                  </div>
                  <div className="flex items-start">
                    <svg
                      className="w-5 h-5 text-purple-600 mr-3 mt-0.5 flex-shrink-0"
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
                    <Text className="text-sm text-gray-600">
                      Explore our features and discover what you can do
                    </Text>
                  </div>
                  <div className="flex items-start">
                    <svg
                      className="w-5 h-5 text-purple-600 mr-3 mt-0.5 flex-shrink-0"
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
                    <Text className="text-sm text-gray-600">
                      Connect with our community and get support
                    </Text>
                  </div>
                </div>
              </Section>

              {/* Support */}
              <div className="text-center mt-6">
                <Text className="text-sm text-gray-600">
                  Need help?{" "}
                  <Link href="/support" className="text-purple-600 font-medium">
                    Contact our support team
                  </Link>
                </Text>
              </div>
            </Section>

            {/* Footer */}
            <Section className="bg-gray-50 p-6 rounded-b-lg border-t">
              <Text className="text-xs text-gray-500 text-center">
                This is an automated message. Please do not reply to this email.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export default WelcomeEmail;
