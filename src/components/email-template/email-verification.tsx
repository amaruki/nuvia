import React from 'react';
import { Body, Button, Container, Head, Html, Preview, Section, Text } from '@react-email/components';
import { Tailwind } from '@react-email/tailwind';

interface EmailVerificationProps {
  verificationUrl: string;
  userName?: string;
}

export function EmailVerificationEmail({ verificationUrl, userName }: EmailVerificationProps) {
  return (
    <Html>
      <Head />
      <Preview>Verify your email address</Preview>
      <Tailwind>
        <Body className="bg-gray-50 font-sans">
          <Container className="max-w-lg mx-auto bg-white rounded-lg shadow-lg">
            {/* Logo/Header */}
            <Section className="bg-green-600 text-white p-6 rounded-t-lg">
              <div className="text-center">
                <div className="w-12 h-12 bg-white rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <h1 className="text-2xl font-bold mb-2">Verify Your Email</h1>
                <p className="text-green-100">
                  {userName ? `Welcome ${userName}!` : 'Welcome!'}
                </p>
              </div>
            </Section>

            {/* Main Content */}
            <Section className="p-8">
              <Text className="text-gray-700 leading-6 mb-6">
                Please click the button below to verify your email address and complete your registration:
              </Text>

              <div className="text-center my-6">
                <Button
                  href={verificationUrl}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700"
                >
                  Verify Email
                </Button>
              </div>

              {/* Instructions */}
              <Section className="bg-green-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Getting Started</h3>
                <Text className="text-sm text-gray-600 leading-5">
                  • Click the verification button above to activate your account
                  <br />
                  • You'll be redirected to our platform once verified
                  <br />
                  • If you didn't create this account, you can safely ignore this email
                </Text>
              </Section>
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

export default EmailVerificationEmail;