/**
 * UI-22 — sidebar & shell correctness.
 *
 * Covers docs/planning/03-frontend-improvement-plan.md UI-22:
 *
 *   1. The sidebar role filter answers the same question the server gate
 *      (src/lib/dashboard-access.ts) answers: it flattens every nav level
 *      and decides per URL, so a section stays visible when a role can
 *      reach its own URL or any child URL (members see Events because
 *      /dashboard/events/calendar names member roles).
 *   2. Every parent/child role divergence in navigation-data is pinned in
 *      PINNED_PARENT_CHILD_ROLE_DELTAS; the manifest test fails until a
 *      deliberate edit updates that list.
 *   3. While the session is still resolving the sidebar renders a skeleton
 *      instead of role-filtering against an unknown role (the old
 *      `user?.role as UserRole` cast dropped every gated item).
 *   4. Every navigation category renders (personal was discarded by the
 *      hardcoded main+admin list) and nav ids are unique (the duplicated
 *      member-analytics id is gone).
 *   5. The sidebar_state cookie store in src/components/ui/sidebar is the
 *      only sidebar-state source; DashboardProvider keeps no localStorage
 *      copy and no dead theme slice.
 *   6. Every setHeader caller cleans up with clearHeader so headers never
 *      leak onto the next page (forum-layout used to leak).
 *
 * Run: bun test tests/sidebar-correctness.test.ts
 */
import { describe, expect, mock, test } from "bun:test";
import { Glob } from "bun";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";

import { navigationData } from "@/lib/navigation-data";
import type { NavItemData } from "@/lib/navigation-data";
import { isRoleAllowedForPath } from "@/lib/dashboard-access";
import { USER_ROLES } from "@/types/dashboard.types";
import type { UserRole } from "@/types/dashboard.types";

// ---------------------------------------------------------------------------
// Render-test module setup. The mocks must be registered before the sidebar
// tree is imported, so the component imports below use await import():
// static imports would hoist above the mock.module calls and load the real
// use-session/next/navigation/footer modules. This is the intentional
// module-loading-boundary exception to the no-dynamic-import rule.
// The session stub is mutated per test below.
// ---------------------------------------------------------------------------

const sessionState: { user: { role: string } | null; isPending: boolean } = {
  user: null,
  isPending: true,
};

mock.module("@/hooks/use-session", () => ({
  useSession: () => sessionState,
}));

mock.module("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({ push: () => {}, replace: () => {}, back: () => {} }),
}));

// Stub the footer: it imports server actions (auth/db) this test never
// exercises, and the pending-session skeleton renders its own placeholder.
mock.module("@/components/dashboard/layout/sidebar-footer", () => ({
  SidebarFooterComponent: () => createElement("div", { "data-test-stub": "sidebar-footer" }),
}));

const { renderToString } = await import("react-dom/server");
const { SidebarProvider } = await import("@/components/ui/sidebar");
const { DashboardSidebar, filterNavigationByRole } =
  await import("@/components/dashboard/layout/dashboard-sidebar");
const { NavigationRenderer } = await import("@/components/dashboard/layout/navigation-group");
const { navigationConfig } = await import("@/components/dashboard/layout/navigation-config");

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------
/** USER_ROLES deliberately excludes "demo" (UI-39); the nav data names it. */
const ALL_ROLES: readonly string[] = [...USER_ROLES, "demo"];

const REPO_ROOT = join(import.meta.dir, "..", "..");

const readRepoFile = (relativePath: string): string =>
  readFileSync(join(REPO_ROOT, relativePath), "utf8");

function collectNavItems(items: readonly NavItemData[]): NavItemData[] {
  const collected: NavItemData[] = [];
  const walk = (list: readonly NavItemData[]): void => {
    for (const item of list) {
      collected.push(item);
      if (item.subItems) walk(item.subItems);
    }
  };
  walk(items);
  return collected;
}

// ---------------------------------------------------------------------------
// UI-22.2 — the pinned parent/child role divergence manifest.
// Keyed by child path (unique in navigation-data); `added` lists roles the
// child grants beyond its parent, `removed` roles the parent grants that
// the child withholds. Any new divergence fails the manifest test until it
// is deliberately added here.
// ---------------------------------------------------------------------------

interface RoleDelta {
  readonly added: readonly UserRole[];
  readonly removed: readonly UserRole[];
}

const PINNED_PARENT_CHILD_ROLE_DELTAS: Record<string, RoleDelta> = {
  "/dashboard/users/roles": { added: [], removed: ["staff"] },
  "/dashboard/users/security": { added: [], removed: ["staff"] },
  "/dashboard/memberships/directory": {
    added: ["member", "member_corporate", "member_professional", "moderator"],
    removed: [],
  },
  "/dashboard/memberships/tiers": { added: [], removed: ["chapter_admin", "chapter_president"] },
  "/dashboard/memberships/renewals": {
    added: [],
    removed: ["chapter_admin", "chapter_president"],
  },
  "/dashboard/events/calendar": {
    added: [
      "member",
      "member_corporate",
      "member_professional",
      "member_student",
      "moderator",
      "treasurer",
      "user",
    ],
    removed: [],
  },
  "/dashboard/events/registrations": {
    added: [],
    removed: ["chapter_admin", "chapter_president", "demo"],
  },
  "/dashboard/events/checkin": {
    added: [],
    removed: ["chapter_president", "committee_chair", "demo"],
  },
  "/dashboard/events/certificates": {
    added: [],
    removed: ["chapter_admin", "chapter_president", "committee_chair", "demo"],
  },
  "/dashboard/events/pricing": {
    added: [],
    removed: ["chapter_admin", "chapter_president", "committee_chair", "demo"],
  },
  "/dashboard/finance/budget": {
    added: ["chapter_president", "committee_chair"],
    removed: ["staff"],
  },
  "/dashboard/finance/reports": { added: [], removed: ["staff"] },
  "/dashboard/finance/gateways": { added: [], removed: ["staff"] },
  "/dashboard/organization/chapters": { added: [], removed: ["committee_chair"] },
  "/dashboard/organization/committees": { added: [], removed: ["chapter_admin"] },
  "/dashboard/organization/workspaces": {
    added: ["member", "member_professional"],
    removed: ["chapter_admin", "chapter_president", "demo"],
  },
  "/dashboard/organization/budget": {
    added: ["treasurer"],
    removed: ["chapter_admin", "chapter_president", "demo"],
  },
  "/dashboard/content/publications": { added: [], removed: ["demo", "moderator"] },
  "/dashboard/content/announcements": {
    added: ["chapter_admin", "committee_chair"],
    removed: ["moderator"],
  },
  "/dashboard/content/categories": { added: [], removed: ["demo", "moderator"] },
  "/dashboard/content/media": { added: [], removed: ["demo", "moderator"] },
  "/dashboard/learning/courses": {
    added: [],
    removed: [
      "chapter_admin",
      "chapter_president",
      "committee_chair",
      "moderator",
      "organizer",
      "treasurer",
    ],
  },
  "/dashboard/learning/my-courses": {
    added: [],
    removed: [
      "chapter_admin",
      "chapter_president",
      "committee_chair",
      "moderator",
      "organizer",
      "treasurer",
    ],
  },
  "/dashboard/learning/certifications": {
    added: [],
    removed: [
      "chapter_admin",
      "chapter_president",
      "committee_chair",
      "moderator",
      "organizer",
      "treasurer",
    ],
  },
  "/dashboard/learning/admin": {
    added: [],
    removed: [
      "chapter_admin",
      "chapter_president",
      "committee_chair",
      "demo",
      "member",
      "member_corporate",
      "member_professional",
      "member_student",
      "moderator",
      "organizer",
      "treasurer",
      "user",
    ],
  },
  "/dashboard/learning/certificate-management": {
    added: [],
    removed: [
      "chapter_admin",
      "chapter_president",
      "committee_chair",
      "demo",
      "member",
      "member_corporate",
      "member_professional",
      "member_student",
      "moderator",
      "organizer",
      "treasurer",
      "user",
    ],
  },
  "/dashboard/learning/settings": {
    added: [],
    removed: [
      "chapter_admin",
      "chapter_president",
      "committee_chair",
      "demo",
      "member",
      "member_corporate",
      "member_professional",
      "member_student",
      "moderator",
      "treasurer",
      "user",
    ],
  },
  "/dashboard/forums/categories": {
    added: [],
    removed: [
      "chapter_admin",
      "chapter_president",
      "committee_chair",
      "demo",
      "member",
      "member_corporate",
      "member_professional",
      "member_student",
      "organizer",
      "treasurer",
      "user",
    ],
  },
  "/dashboard/forums/moderation": {
    added: [],
    removed: [
      "chapter_admin",
      "chapter_president",
      "committee_chair",
      "demo",
      "member",
      "member_corporate",
      "member_professional",
      "member_student",
      "organizer",
      "treasurer",
      "user",
    ],
  },
  "/dashboard/forums/reports": {
    added: [],
    removed: [
      "chapter_admin",
      "chapter_president",
      "committee_chair",
      "demo",
      "member",
      "member_corporate",
      "member_professional",
      "member_student",
      "organizer",
      "treasurer",
      "user",
    ],
  },
  "/dashboard/awards/programs": {
    added: ["committee_chair"],
    removed: [
      "demo",
      "member",
      "member_corporate",
      "member_professional",
      "member_student",
      "user",
    ],
  },
  "/dashboard/awards/nominations": {
    added: ["committee_chair"],
    removed: [
      "demo",
      "member",
      "member_corporate",
      "member_professional",
      "member_student",
      "user",
    ],
  },
  "/dashboard/communications/newsletters": {
    added: [],
    removed: ["chapter_admin", "committee_chair", "moderator"],
  },
  "/dashboard/communications/notifications": {
    added: [],
    removed: ["chapter_admin", "committee_chair", "moderator"],
  },
  "/dashboard/communications/calendar": {
    added: [],
    removed: ["chapter_admin", "committee_chair", "moderator"],
  },
  "/dashboard/analytics/members": { added: [], removed: ["treasurer"] },
  "/dashboard/analytics/events": {
    added: ["organizer"],
    removed: ["chapter_president", "treasurer"],
  },
  "/dashboard/analytics/financial": {
    added: [],
    removed: ["chapter_admin", "chapter_president", "staff"],
  },
  "/dashboard/analytics/content": {
    added: ["moderator"],
    removed: ["chapter_admin", "chapter_president", "treasurer"],
  },
  "/dashboard/analytics/custom": { added: [], removed: ["chapter_admin", "chapter_president"] },
  "/dashboard/settings/payments": { added: ["treasurer"], removed: [] },
};

function computeParentChildRoleDeltas(): Record<string, RoleDelta> {
  const deltas: Record<string, RoleDelta> = {};
  const walk = (items: readonly NavItemData[]): void => {
    for (const item of items) {
      if (item.subItems && item.roles) {
        for (const child of item.subItems) {
          if (!child.roles) continue;
          const parentRoles = new Set(item.roles);
          const childRoles = new Set(child.roles);
          const added = child.roles.filter((role) => !parentRoles.has(role)).sort();
          const removed = item.roles.filter((role) => !childRoles.has(role)).sort();
          if (added.length > 0 || removed.length > 0) {
            if (deltas[child.path]) {
              throw new Error(`Duplicate child path in navigation data: ${child.path}`);
            }
            deltas[child.path] = { added, removed };
          }
        }
      }
      if (item.subItems) walk(item.subItems);
    }
  };
  walk(navigationData);
  return deltas;
}

// ---------------------------------------------------------------------------
// UI-22.1 — the filter mirrors the server gate
// ---------------------------------------------------------------------------

describe("sidebar role filter mirrors dashboard-access (UI-22.1)", () => {
  test("member sees Events with the calendar child — and only that child", () => {
    const filtered = filterNavigationByRole(navigationConfig, "member");

    const events = filtered.find((item) => item.id === "events");
    expect(events).toBeDefined();
    expect(events?.subItems?.map((child) => child.id)).toEqual(["event-calendar"]);

    // Same shape for the other child-grants-parent sections.
    const memberships = filtered.find((item) => item.id === "memberships");
    expect(memberships?.subItems?.map((child) => child.id)).toEqual(["member-directory"]);
    const organization = filtered.find((item) => item.id === "organization");
    expect(organization?.subItems?.map((child) => child.id)).toEqual(["committee-workspaces"]);

    // Whole admin-only sections stay hidden.
    for (const id of [
      "user-management",
      "finance",
      "analytics",
      "system-settings",
      "system-tools",
    ]) {
      expect(filtered.some((item) => item.id === id)).toBe(false);
    }
  });

  test("sidebar visibility equals server-gate reachability for every role", () => {
    for (const role of ALL_ROLES) {
      const sourceItems = collectNavItems(navigationData);
      const keptItems = collectNavItems(filterNavigationByRole(navigationConfig, role));
      const keptPaths = new Set(keptItems.map((item) => item.path));

      // Nothing the gate would serve is hidden from the sidebar.
      for (const item of sourceItems) {
        if (isRoleAllowedForPath(item.path, role)) {
          expect(keptPaths.has(item.path)).toBe(true);
        }
      }

      // Nothing the gate would deny is shown: kept leaves are reachable,
      // and a kept parent denied at its own URL exists only as a
      // collapsible shell for visible children.
      for (const item of keptItems) {
        const selfAllowed = isRoleAllowedForPath(item.path, role);
        if (!item.subItems) {
          expect(selfAllowed).toBe(true);
        } else if (!selfAllowed) {
          expect(item.subItems.length).toBeGreaterThan(0);
        }
      }
    }
  });

  test("no role: nothing role-gated renders", () => {
    const keptItems = collectNavItems(filterNavigationByRole(navigationConfig, null));
    for (const item of keptItems) {
      expect(isRoleAllowedForPath(item.path, null)).toBe(true);
    }
    // Every nav item declares roles today, so in practice nothing renders.
    expect(keptItems).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// UI-22.2 — nav manifest pins the divergence list
// ---------------------------------------------------------------------------

describe("nav manifest (UI-22.2)", () => {
  test("computed parent/child role deltas match the pinned list exactly", () => {
    expect(computeParentChildRoleDeltas()).toEqual(PINNED_PARENT_CHILD_ROLE_DELTAS);
  });

  test("the divergences called out in the UI-22 plan stay pinned with added roles", () => {
    for (const path of [
      "/dashboard/events/calendar",
      "/dashboard/memberships/directory",
      "/dashboard/finance/budget",
      "/dashboard/organization/workspaces",
      "/dashboard/organization/budget",
      "/dashboard/content/announcements",
    ]) {
      expect(PINNED_PARENT_CHILD_ROLE_DELTAS[path]).toBeDefined();
      expect(PINNED_PARENT_CHILD_ROLE_DELTAS[path].added.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// UI-22.3 — skeleton while the session is pending (render)
// UI-22.4 — personal category renders, ids unique (render + data)
// ---------------------------------------------------------------------------

describe("sidebar shell render (UI-22.3 / UI-22.4)", () => {
  const renderSidebarHtml = (): string =>
    renderToString(createElement(SidebarProvider, null, createElement(DashboardSidebar, {})));

  test("pending session renders a skeleton, not a role-filtered nav", () => {
    sessionState.user = null;
    sessionState.isPending = true;

    const html = renderSidebarHtml();
    expect(html).toContain('data-slot="skeleton"');
    expect(html).toContain('aria-busy="true"');
    // The real nav — including its group labels — must not flash before
    // the session lands.
    expect(html).not.toContain("Workspace");
    expect(html).not.toContain("Personal");
    expect(html).not.toContain("Admin");
  });

  test("member shell shows gated parents and the personal group, not admin groups", () => {
    sessionState.user = { role: "member" };
    sessionState.isPending = false;

    const html = renderSidebarHtml();
    expect(html).toContain("Workspace");
    expect(html).toContain("Personal");
    // Parents kept alive purely by reachable children (UI-22.1).
    expect(html).toContain("Events");
    expect(html).toContain("Memberships");
    expect(html).toContain("Organization");
    // Admin-only sections and the whole Admin group stay hidden.
    expect(html).not.toContain("Admin");
    expect(html).not.toContain("Users");
    expect(html).not.toContain("Tools");
    expect(html).not.toContain("Finance");
    expect(html).not.toContain("Analytics");
  });

  test("admin shell renders every category including Admin", () => {
    sessionState.user = { role: "admin" };
    sessionState.isPending = false;

    const html = renderSidebarHtml();
    expect(html).toContain("Workspace");
    expect(html).toContain("Personal");
    expect(html).toContain("Admin");
    expect(html).toContain("Users");
    expect(html).toContain("Tools");
  });

  test("NavigationRenderer renders the personal category (previously discarded)", () => {
    const personalItems = navigationConfig.filter((item) => item.category === "personal");
    expect(personalItems.length).toBeGreaterThan(0);

    // Navigation items read sidebar context (collapsed/mobile state).
    const html = renderToString(
      createElement(
        SidebarProvider,
        null,
        createElement(NavigationRenderer, {
          navigationGroups: { personal: [...personalItems] },
          isActive: () => false,
        }),
      ),
    );
    expect(html).toContain('data-slot="sidebar-group"');
    expect(html).toContain("Personal");
  });

  test("nav item ids are unique across every section (member-analytics dedupe)", () => {
    const ids = collectNavItems(navigationData).map((item) => item.id);
    expect(ids.length).toBe(new Set(ids).size);
    // The analytics copy keeps the original id; the memberships copy moved.
    expect(ids.filter((id) => id === "member-analytics")).toHaveLength(1);
    expect(ids).toContain("membership-analytics");
  });
});

// ---------------------------------------------------------------------------
// UI-22.5 — one sidebar-state source (cookie), dead slices deleted
// ---------------------------------------------------------------------------

describe("single sidebar-state source (UI-22.5)", () => {
  test("dashboard context keeps no localStorage sidebar or theme copy", () => {
    const contextDir = join(REPO_ROOT, "src", "contexts", "dashboard-context");
    const files = readdirSync(contextDir).filter(
      (name) => name.endsWith(".ts") || name.endsWith(".tsx"),
    );
    expect(files.length).toBeGreaterThan(0);
    for (const name of files) {
      const text = readFileSync(join(contextDir, name), "utf8");
      expect(text).not.toMatch(/localStorage/);
      expect(text).not.toMatch(
        /sidebarCollapsed|TOGGLE_SIDEBAR|SET_THEME|dashboard-theme|dashboard-sidebar-collapsed/,
      );
    }
  });

  test("the sidebar_state cookie store is the surviving source", () => {
    const constants = readRepoFile("src/components/ui/sidebar/constants.ts");
    expect(constants).toContain('SIDEBAR_COOKIE_NAME = "sidebar_state"');
    const provider = readRepoFile("src/components/ui/sidebar/sidebar-provider.tsx");
    expect(provider).toContain("document.cookie");
    expect(provider).toContain("SIDEBAR_COOKIE_NAME");
  });
});

// ---------------------------------------------------------------------------
// UI-22.6 — every setHeader caller cleans up with clearHeader
// ---------------------------------------------------------------------------

describe("header lifecycle (UI-22.6)", () => {
  test("every setHeader caller clears the header on unmount", () => {
    const offenders: string[] = [];
    for (const file of new Glob("**/*.{ts,tsx}").scanSync(join(REPO_ROOT, "src"))) {
      const text = readRepoFile(join("src", file));
      if (text.includes("setHeader(") && !text.includes("clearHeader")) {
        offenders.push(file);
      }
    }
    expect(offenders).toEqual([]);
  });

  test("forum-layout clears the forums header on unmount", () => {
    const text = readRepoFile("src/app/dashboard/forums/_components/forum-layout.tsx");
    expect(text).toMatch(/return\s*\(\)\s*=>\s*\{[\s\S]*?clearHeader\(\);/);
  });
});
