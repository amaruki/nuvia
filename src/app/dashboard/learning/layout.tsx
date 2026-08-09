/**
 * Learning & Development section layout — renders the shared mock-tier
 * banner above every learning page while the module's maturity flag is off
 * (ADR-0008, backlog A1). The banner returns null on its own once learning
 * is promoted.
 */

import { ReactNode } from "react";
import { ModulePreviewBanner } from "@/components/dashboard/module-preview-banner";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

interface LearningSectionLayoutProps {
  children: ReactNode;
}

export default function LearningSectionLayout({ children }: LearningSectionLayoutProps) {
  return (
    <>
      <ModulePreviewBanner module="learning" />
      {children}
    </>
  );
}
