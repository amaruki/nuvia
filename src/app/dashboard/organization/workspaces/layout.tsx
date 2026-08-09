/**
 * Committee Workspaces section layout (organization structure) — renders
 * the shared mock-tier banner above the workspaces pages while the
 * module's maturity flag is off (ADR-0008, backlog A1).
 */

import { ReactNode } from "react";
import { ModulePreviewBanner } from "@/components/dashboard/module-preview-banner";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

interface WorkspacesSectionLayoutProps {
  children: ReactNode;
}

export default function WorkspacesSectionLayout({ children }: WorkspacesSectionLayoutProps) {
  return (
    <>
      <ModulePreviewBanner module="workspaces" />
      {children}
    </>
  );
}
