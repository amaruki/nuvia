import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { desc, isNull } from "drizzle-orm";

import { db } from "@/db/client";
import { user } from "@/db/schema";
import { Badge } from "@/components/ui/badge";
import { DarkModeToggle } from "@/components/ui/dark-mode-toggle";

import { AppShellDemo } from "./_components/app-shell-demo";
import { BrandSection } from "./_components/brand-section";
import { ChartDemo } from "./_components/chart-demo";
import { DoDontDemo } from "./_components/do-dont-demo";
import { FormDemo } from "./_components/form-demo";
import { MembersTableDemo } from "./_components/members-table-demo";
import { OverlayDemo } from "./_components/overlay-demo";
import { PrimitiveGallery } from "./_components/primitive-gallery";
import { RealUsersTable, type RealUserRow } from "./_components/real-users-table";
import { SectionShell } from "./_components/section-shell";
import { StateMatrixDemo } from "./_components/state-matrix-demo";
import { TableStatesDemo } from "./_components/table-states-demo";
import { TokensDemo } from "./_components/tokens-demo";
import { WidgetsDemo } from "./_components/widgets-demo";

export const metadata: Metadata = {
  title: "Design system preview",
};

export default async function DesignPreviewPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  // Minimal projection only: no passwordHash, tokens, or emailVerified.
  // This read is dev-only (route 404s in production); real pages follow the
  // exposure matrix in docs/planning/03-frontend-improvement-plan.md.
  const realUsers: RealUserRow[] = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    })
    .from(user)
    .where(isNull(user.deletedAt))
    .orderBy(desc(user.createdAt))
    .limit(25);

  return (
    <>
      <header className="border-border/60 bg-background/80 sticky top-0 z-40 border-b backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="Nuvia logo" width={28} height={28} className="rounded-md" />
            <span className="font-semibold tracking-tight">Nuvia</span>
            <Badge variant="outline">design preview</Badge>
          </div>
          <DarkModeToggle />
        </div>
      </header>

      {/* UI-11: skip-to-content link target (see src/app/layout.tsx). */}
      <main id="main-content" tabIndex={-1} className="mx-auto max-w-6xl space-y-14 px-4 py-10">
        <div className="space-y-2">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Dev-only preview, returns 404 in production
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">Design system preview</h1>
          <p className="text-muted-foreground max-w-3xl text-sm leading-relaxed">
            Every pattern the frontend improvement plan ships, side by side: brand identity and
            motion (plans/001), the DataTable layer (UI-09, decision D12: TanStack Table v8 under
            shadcn styling, with faceted filtering and URL-synced state), the form standard (UI-16),
            overlays, charts (D5), widgets, the backoffice shell, and async state primitives
            (UI-14). Each section lists the production pages that will consume it. Use the theme
            toggle to check both themes.
          </p>
        </div>

        <SectionShell
          id="brand"
          index={1}
          title="Brand identity"
          description="The lockup, the brand voice quoted verbatim from the landing page, and the motion identity from globals.css. New pages reuse these recipes instead of inventing new surface styles."
          consumers={["Root layout", "Landing page", "Site footer"]}
        >
          <BrandSection />
        </SectionShell>

        <SectionShell
          id="identity"
          index={2}
          title="Identity: tokens, typography, motion"
          description="Color tokens defined once in globals.css for both themes, the type scale used across the app, and the motion tokens from plans/001 (--ease-out for entrances and hovers, --ease-drawer for the sheet)."
          consumers={["globals.css", "All surfaces"]}
        >
          <TokensDemo />
        </SectionShell>

        <SectionShell
          id="table-full"
          index={3}
          title="DataTable: filter, sort, search, selection, pagination"
          description="State lives in URL search params via useDataTableState (sort, q, status, chapter, page, perPage), so views survive navigation and can be shared. Faceted filters show server-style counts per column, selection drives the floating bulk bar, and this component plays the role of the server over the demo dataset."
          consumers={["Backoffice member directory (UI-09)", "All backoffice list pages"]}
        >
          <MembersTableDemo />
        </SectionShell>

        <SectionShell
          id="table-states"
          index={4}
          title="Async states: loading, error, empty, toast"
          description="Every surface renders exactly one of loading, error, or empty. Error panels always offer a retry action, empty panels explain the next step, and mutation outcomes report through toasts (UI-14)."
          consumers={["Every async list surface", "Mutation handlers"]}
        >
          <TableStatesDemo />
        </SectionShell>

        <SectionShell
          id="form-standard"
          index={5}
          title="Form standard: react-hook-form plus zod"
          description="One schema per form, validation errors rendered inline by FormMessage, submit button shows a pending state. No bare useState submits (UI-16)."
          consumers={["Member application form", "Event create and edit", "All backoffice forms"]}
        >
          <FormDemo />
        </SectionShell>

        <SectionShell
          id="primitives"
          index={6}
          title="Primitive gallery"
          description="Buttons, badges with the status mapping used in tables, inputs, avatars, menus, popovers, calendars, accordions, alerts, progress, and scroll areas. All colored by tokens, no hardcoded palette."
          consumers={["All pages"]}
        >
          <PrimitiveGallery />
        </SectionShell>

        <SectionShell
          id="overlays"
          index={7}
          title="Overlays and disclosure"
          description="Dialog for creation flows, alert dialog for destructive confirms, tabs for in-page views, tooltips for icon-only buttons, and the sheet drawer running on the motion tokens."
          consumers={["Create and edit dialogs", "Destructive confirmations"]}
        >
          <OverlayDemo />
        </SectionShell>

        <SectionShell
          id="charts"
          index={8}
          title="Charts (decision D5: shadcn chart on recharts)"
          description="ChartContainer maps chart config keys to the --chart-1 through --chart-5 tokens, so charts follow the theme. Data below is derived from the demo dataset."
          consumers={["Dashboard overview", "Membership growth reports"]}
        >
          <ChartDemo />
        </SectionShell>

        <SectionShell
          id="widgets"
          index={9}
          title="Widgets and stat cards"
          description="Stat cards follow the house pattern from the membership tiers overview (icon chip, bold value, muted trend line) inside WidgetContainer, and the async trio shows the same content loading, failing with retry, and succeeding."
          consumers={["Dashboard overview", "Membership tiers page"]}
        >
          <WidgetsDemo />
        </SectionShell>

        <SectionShell
          id="app-shell"
          index={10}
          title="Backoffice app shell"
          description="Collapsible sidebar on the real Sidebar primitives, breadcrumb trail, and a page header with actions. This is the layout every backoffice page composes into (UI-22 nav convergence)."
          consumers={["Backoffice layout", "All admin pages"]}
        >
          <AppShellDemo />
        </SectionShell>

        <SectionShell
          id="do-dont"
          index={11}
          title="Do and don't"
          description="Real violations found in this codebase next to their corrected versions: hardcoded palette colors, em dashes in copy, hardcoded status colors, and emoji as icons."
          consumers={["Code review baseline"]}
        >
          <DoDontDemo />
        </SectionShell>

        <SectionShell
          id="state-matrix"
          index={12}
          title="Interactive state matrix"
          description="Every input primitive across default, disabled, error, and pending states, with focus behavior documented in the caption. Errors wire aria-invalid to a visible message."
          consumers={["Accessibility checklist (WCAG 2.2 AA)"]}
        >
          <StateMatrixDemo />
        </SectionShell>

        <SectionShell
          id="real-data"
          index={13}
          title="Real data from the database"
          description="The newest 25 users, read server-side with a minimal projection (name, email, role, joined). Sorting and search run client-side here because the dataset is small; production pages use the URL search params pattern from section 3."
          consumers={["Proof: dev-only read with minimal projection"]}
        >
          <RealUsersTable users={realUsers} />
        </SectionShell>
      </main>
    </>
  );
}
