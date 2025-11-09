import Link from "next/link";
import Image from "next/image";
import { DarkModeToggle } from "@/components/ui/dark-mode-toggle";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="flex items-center justify-between p-6 container mx-auto">
        <div className="flex items-center space-x-3">
          <Image
            src="/logo.png"
            alt="Nuvia Logo"
            width={40}
            height={40}
            className="rounded-md"
          />
          <div className="text-xl font-semibold text-foreground/90">Nuvia</div>
        </div>
        <div className="hidden md:flex space-x-8">
          <Link href="#features" className="text-foreground/60 hover:text-foreground/90">Features</Link>
          <Link href="#about" className="text-foreground/60 hover:text-foreground/90">About</Link>
          <Link href="#community" className="text-foreground/60 hover:text-foreground/90">Community</Link>
          <Link href="#contribute" className="text-foreground/60 hover:text-foreground/90">Contribute</Link>
        </div>
        <div className="flex items-center space-x-4">
          <DarkModeToggle />
          <Link href="/auth/login" className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-6 container mx-auto text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-foreground/90 mb-6">
          Open Source Community Management Platform
        </h1>
        <p className="text-xl text-foreground/60 max-w-3xl mx-auto mb-10">
          A comprehensive and flexible platform for managing communities, organizations, and memberships.
          Built by the community, for the community.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link href="/dashboard" className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
            View Demo
          </Link>
          <Link href="https://github.com" target="_blank" className="px-6 py-3 border border-border text-foreground/70 rounded-md hover:bg-background transition-colors">
            View on GitHub
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 px-6 bg-background">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center text-foreground/90 mb-12">Core Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-card p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold text-foreground/90 mb-3">User Management</h3>
              <p className="text-foreground/60">Comprehensive user profiles, roles, and permissions system for community members.</p>
            </div>
            <div className="bg-card p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold text-foreground/90 mb-3">Membership Tiers</h3>
              <p className="text-foreground/60">Flexible multi-tier membership system with automated renewals and benefits.</p>
            </div>
            <div className="bg-card p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold text-foreground/90 mb-3">Event Management</h3>
              <p className="text-foreground/60">Create events with registration, ticketing, pricing options, and QR code check-in.</p>
            </div>
            <div className="bg-card p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold text-foreground/90 mb-3">Content Management</h3>
              <p className="text-foreground/60">Publish and organize content with a flexible CMS tailored for communities.</p>
            </div>
            <div className="bg-card p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold text-foreground/90 mb-3">Financial Tools</h3>
              <p className="text-foreground/60">Handle donations, fundraising, invoices, and recurring payments securely.</p>
            </div>
            <div className="bg-card p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold text-foreground/90 mb-3">Business Directory</h3>
              <p className="text-foreground/60">Connect members with a community business directory and job board.</p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-16 px-6 container mx-auto">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-foreground mb-6">Built for the Community</h2>
          <p className="text-lg text-foreground/60 mb-8">
            Nuvia is designed as a modular, extensible platform that starts as a monolith but can evolve
            with your community&apos;s needs. We&apos;re focused on keeping hosting costs low while providing
            professional-grade features for organizations of all sizes.
          </p>
          <p className="text-lg text-foreground/60">
            Starting with core MVP features like user management, events, membership, and basic content,
            we&apos;ll gradually expand to include more complex modules like finance, real-time integrations,
            multi-tenancy, and analytics.
          </p>
        </div>
      </section>

      {/* Community Section */}
      <section id="community" className="py-16 px-6 bg-background">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center text-foreground/90 mb-12">Join Our Community</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-foreground mb-2">Open Source</div>
              <p className="text-foreground/60">Freely accessible, developed, and customized by a global community.</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-foreground mb-2">Community Driven</div>
              <p className="text-foreground/60">Shaped by feedback and contributions from users worldwide.</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-foreground mb-2">Sustainable</div>
              <p className="text-foreground/60">Built to last with a focus on long-term viability and growth.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contribute Section */}
      <section id="contribute" className="py-16 px-6 container mx-auto">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground mb-6">Contribute to Nuvia</h2>
          <p className="text-lg text-foreground/60 max-w-3xl mx-auto mb-10">
            We welcome developers, designers, and community organizers to help shape the future of
            community management platforms. Whether you&apos;re contributing code, documentation, or feedback,
            your involvement makes Nuvia better for everyone.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="https://github.com" target="_blank" className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
              Contribute on GitHub
            </Link>
            <Link href="/docs" className="px-6 py-3 border border-border text-foreground/70 rounded-md hover:bg-background transition-colors">
              Read Documentation
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-foreground/90 text-white">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <div className="text-xl font-semibold">Nuvia</div>
              <p className="text-foreground/40 mt-2">Open Source Community Management</p>
            </div>
            <div className="flex space-x-6">
              <Link href="https://github.com" target="_blank" className="text-foreground/40 hover:text-white">
                GitHub
              </Link>
              <Link href="/docs" className="text-foreground/40 hover:text-white">
                Documentation
              </Link>
              <Link href="/community" className="text-foreground/40 hover:text-white">
                Community
              </Link>
              <Link href="/blog" className="text-foreground/40 hover:text-white">
                Blog
              </Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-border text-center text-foreground/40">
            <p>© {new Date().getFullYear()} Nuvia. Open source under MIT License.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
