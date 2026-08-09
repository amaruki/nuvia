import { SiteHeader } from "./_components/site-header";
import { HeroSection } from "./_components/hero-section";
import { FeaturesSection } from "./_components/features-section";
import { ModulesSection } from "./_components/modules-section";
import { CommunitySection } from "./_components/community-section";
import { ContributeSection } from "./_components/contribute-section";
import { CtaSection } from "./_components/cta-section";
import { SiteFooter } from "./_components/site-footer";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default function Home() {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <SiteHeader />
      {/* UI-11: skip-to-content link target (see src/app/layout.tsx). */}
      <main id="main-content" tabIndex={-1}>
        <HeroSection />
        <FeaturesSection />
        <ModulesSection />
        <CommunitySection />
        <ContributeSection />
        <CtaSection />
      </main>
      <SiteFooter />
    </div>
  );
}
