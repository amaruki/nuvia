/**
 * Awards section layout — renders the shared mock-tier banner above every
 * awards page while the module's maturity flag is off (ADR-0008, backlog
 * A1). The banner returns null on its own once awards is promoted.
 */

import { ReactNode } from "react";
import { ModulePreviewBanner } from "@/components/dashboard/module-preview-banner";

interface AwardsSectionLayoutProps {
  children: ReactNode;
}

export default function AwardsSectionLayout({ children }: AwardsSectionLayoutProps) {
  return (
    <>
      <ModulePreviewBanner module="awards" />
      {children}
    </>
  );
}
