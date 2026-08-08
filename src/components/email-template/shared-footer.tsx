import React from "react";
import { Link, Section, Text } from "@react-email/components";

interface EmailFooterProps {
  organizationName: string;
  supportEmail?: string;
}

/**
 * Shared footer for transactional emails. Reads the deploying association's
 * identity (organization singleton, ADR-0007) instead of hardcoded strings:
 * callers pass `organizationName`/`supportEmail` from the organization row.
 */
export function EmailFooter({ organizationName, supportEmail }: EmailFooterProps) {
  return (
    <Section className="bg-gray-50 p-6 rounded-b-lg border-t">
      <Text className="text-xs text-gray-500 text-center">
        This is an automated message from {organizationName}. Please do not reply to this email.
      </Text>
      {supportEmail && (
        <Text className="text-xs text-gray-500 text-center">
          Need help? Contact{" "}
          <Link href={`mailto:${supportEmail}`} className="text-gray-600 underline">
            {supportEmail}
          </Link>
        </Text>
      )}
    </Section>
  );
}

export default EmailFooter;
