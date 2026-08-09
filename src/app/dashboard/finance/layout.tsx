/**
 * Finance section layout — renders the shared mock-tier banner above every
 * finance page while the module's maturity flag is off (ADR-0008, backlog
 * A1). The banner returns null on its own once finance is promoted.
 */

import { ReactNode } from "react";
import { ModulePreviewBanner } from "@/components/dashboard/module-preview-banner";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

interface FinanceSectionLayoutProps {
  children: ReactNode;
}

export default function FinanceSectionLayout({ children }: FinanceSectionLayoutProps) {
  return (
    <>
      <ModulePreviewBanner module="finance" />
      {children}
    </>
  );
}
