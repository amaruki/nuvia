/**
 * Committee Budgets layout (organization structure) — committee budget
 * management belongs to the finance module's budget surface, so it carries
 * the finance mock-tier banner while finance's maturity flag is off
 * (ADR-0008, backlog A1).
 */

import { ReactNode } from "react";
import { ModulePreviewBanner } from "@/components/dashboard/module-preview-banner";

interface CommitteeBudgetsSectionLayoutProps {
  children: ReactNode;
}

export default function CommitteeBudgetsSectionLayout({
  children,
}: CommitteeBudgetsSectionLayoutProps) {
  return (
    <>
      <ModulePreviewBanner module="finance" />
      {children}
    </>
  );
}
