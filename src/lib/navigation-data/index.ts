/**
 * Pure data behind the dashboard sidebar (navigation-config.tsx composes
 * icons onto this) and behind src/lib/dashboard-access.ts's server-side
 * route authorization. Kept icon-free and framework-free on purpose: this
 * file is imported from src/proxy.ts (Node middleware, runs on every
 * request), and a JSX/lucide-react import there would drag React and ~45
 * icon components into that bundle for no reason.
 */

import type { NavItemData } from "./types";
import { analyticsSection } from "./analytics";
import { awardsSection } from "./awards";
import { communicationsSection } from "./communications";
import { contentSection } from "./content";
import { dashboardOverviewSection } from "./dashboard-overview";
import { eventSection } from "./events";
import { financeSection } from "./finance";
import { forumSection } from "./forums";
import { jobBoardSection } from "./job-board";
import { learningSection } from "./learning";
import { membershipSection } from "./memberships";
import { organizationSection } from "./organization";
import { personalSettingsSection } from "./personal-settings";
import { systemAdminSections } from "./system-admin";
import { userManagementSection } from "./user-management";

export type { NavItemData } from "./types";
export { navigationCategories } from "./categories";

export const navigationData: readonly NavItemData[] = [
  ...dashboardOverviewSection,
  ...userManagementSection,
  ...membershipSection,
  ...eventSection,
  ...financeSection,
  ...organizationSection,
  ...contentSection,
  ...learningSection,
  ...forumSection,
  ...jobBoardSection,
  ...awardsSection,
  ...communicationsSection,
  ...analyticsSection,
  ...systemAdminSections,
  ...personalSettingsSection,
];
