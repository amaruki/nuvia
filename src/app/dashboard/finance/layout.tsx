/**
 * Finance section layout — renders the shared mock-tier banner above every
 * finance page while the module's maturity flag is off (ADR-0008, backlog
 * A1). The banner returns null on its own once finance is promoted.
 */

import { ReactNode } from "react";
import { ModulePreviewBanner } from "@/components/dashboard/module-preview-banner";

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
