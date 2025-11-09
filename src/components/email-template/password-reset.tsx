import React from 'react';
import { Body, Button, Container, Head, Html, Preview, Section, Text } from '@react-email/components';
import { Tailwind } from '@react-email/tailwind';

interface PasswordResetEmailProps {
  resetUrl: string;
  userName?: string;
}

export function PasswordResetEmail({ resetUrl, userName }: PasswordResetEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Reset your password</Preview>
      <Tailwind>
        <Body className="bg-gray-50 font-sans">
          <Container className="max-w-lg mx-auto bg-white rounded-lg shadow-lg">
            {/* Logo/Header */}
            <Section className="bg-blue-600 text-white p-6 rounded-t-lg">
              <div className="text-center">
                <div className="w-12 h-12 bg-white rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path>
                  </svg>
                </div>
                <h1 className="text-2xl font-bold mb-2">Password Reset Request</h1>
                <p className="text-blue-100">
                  {userName ? `Hi ${userName},` : 'Hello,'}
                </p>
              </div>
            </Section>

            {/* Main Content */}
            <Section className="p-8">
              <Text className="text-gray-700 leading-6 mb-6">
                We received a request to reset your password. Click the button below to reset it:
              </Text>

              <div className="text-center my-6">
                <Button
                  href={resetUrl}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700"
                >
                  Reset Password
                </Button>
              </div>

              {/* Security Notice */}
              <Section className="bg-gray-100 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Security Notice</h3>
                <Text className="text-sm text-gray-600 leading-5">
                  • If you didn't request this password reset, you can safely ignore this email.
                  <br />
                  • This link will expire in 1 hour for security reasons.
                  <br />
                  • Never share this link with anyone.
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

export default PasswordResetEmail;