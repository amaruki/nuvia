import type { Metadata } from "next";
import Link from "next/link";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that apply to accounts and content on this Nuvia instance.",
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto p-6">
        {/* Header */}
        <div className="text-center py-12">
          <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
          <p className="text-lg text-muted-foreground">What you agree to when you use this site</p>
        </div>

        <div className="space-y-10 pb-24">
          <p className="text-muted-foreground leading-relaxed">
            This site is an instance of{" "}
            <Link href="/" className="underline underline-offset-4">
              Nuvia
            </Link>
            , an open-source association management system. It is run by the organization that
            installed and configured the software (referred to below as &quot;the operator&quot;).
            These terms are the agreement between you and the operator for using this site.
          </p>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">1. What this site does</h2>
            <p className="text-muted-foreground leading-relaxed">
              Nuvia helps organizations manage members, events, and job listings. Depending on what
              the operator has enabled, you can browse public events and job postings, create an
              account, register for events, and apply to posted jobs. Features that are not enabled
              on this instance are not offered here.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">2. Your account</h2>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground leading-relaxed">
              <li>
                You can create an account with an email address and password, or sign in with
                Google.
              </li>
              <li>
                Please provide accurate information and keep your password to yourself. You are
                responsible for activity under your account.
              </li>
              <li>
                The operator may suspend or remove accounts that break these terms or harm other
                users.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">3. Acceptable use</h2>
            <p className="text-muted-foreground leading-relaxed">Please do not:</p>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground leading-relaxed">
              <li>use the site in a way that breaks applicable law;</li>
              <li>try to access data or accounts that are not yours;</li>
              <li>disrupt the service or probe it for vulnerabilities;</li>
              <li>post content you do not have the right to share.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">4. Content you submit</h2>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground leading-relaxed">
              <li>
                When you register for an event, your registration details (name, email, and any
                notes you add) are shared with the organizer of that event.
              </li>
              <li>
                When you apply to a job posting, your application is shared with the organization
                that posted it.
              </li>
              <li>
                Other content you publish is shown according to the visibility rules of the feature
                you use. You keep ownership of your content; you grant the operator permission to
                store and display it as needed to provide the service.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">5. No warranties</h2>
            <p className="text-muted-foreground leading-relaxed">
              The site is provided as-is. The operator does not promise that it will always be
              available or error-free, and features may change or be turned off at any time.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">6. Changes to these terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              The operator may update these terms over time and will announce material changes on
              the site where practical.
            </p>
          </section>

          <section className="rounded-lg border bg-card p-5 text-sm">
            <h2 className="font-medium mb-2">About this document</h2>
            <p className="text-muted-foreground leading-relaxed">
              Nuvia is open-source software, and every installation is run independently. This
              document is the baseline it ships with; instance operators may adapt it to their
              organization. If you have questions about these terms, contact the organization that
              runs this site. See also the{" "}
              <Link href="/privacy" className="underline underline-offset-4">
                Privacy Policy
              </Link>
              .
            </p>
          </section>

          <p className="text-center text-sm text-muted-foreground">
            <Link href="/" className="hover:underline">
              Back to home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
