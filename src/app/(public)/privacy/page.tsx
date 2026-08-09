import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What data this Nuvia instance collects and what happens to it.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto p-6">
        {/* Header */}
        <div className="text-center py-12">
          <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-lg text-muted-foreground">What we collect, why, and who can see it</p>
        </div>

        <div className="space-y-10 pb-24">
          <p className="text-muted-foreground leading-relaxed">
            This policy explains in plain language what data this site collects and what happens to
            it. It applies to this instance of Nuvia, an open-source association management system,
            run by the organization that operates it (&quot;the operator&quot;).
          </p>

          <section className="rounded-lg border bg-card p-5">
            <h2 className="font-medium mb-3">The short version</h2>
            <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground leading-relaxed">
              <li>We only collect the data needed to run this service.</li>
              <li>We do not sell your data.</li>
              <li>We do not use third-party advertising or analytics trackers.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Account data</h2>
            <p className="text-muted-foreground leading-relaxed">
              When you create an account we store your name, your chosen username, your email
              address, and your password. Passwords are stored hashed, never in plain text. If you
              sign up with Google, we receive the basic profile Google shares (such as your name,
              email, and profile picture). You can optionally add profile details such as a photo, a
              short bio, and links, and you can edit or remove them in your profile settings.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Sign-in and sessions</h2>
            <p className="text-muted-foreground leading-relaxed">
              Authentication is handled by the open-source library better-auth. When you sign in, a
              session record is created in the database and a session cookie keeps you signed in on
              that device. To protect accounts, login attempts are logged with the time, whether the
              attempt succeeded, your IP address, and your browser and device information.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Where your data lives</h2>
            <p className="text-muted-foreground leading-relaxed">
              All account and activity data is stored in a PostgreSQL database run by the operator
              of this instance.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">What is public</h2>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground leading-relaxed">
              <li>
                Public pages such as event listings and the job board do not show personal data of
                registrants or applicants.
              </li>
              <li>
                Your profile is not public by default. A public member profile is opt-in: it is only
                visible to others if you explicitly enable it, and you can turn it off again at any
                time.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">What we share</h2>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground leading-relaxed">
              <li>
                Event registration details (name, email, and any notes you add) are shared with the
                organizer of the event.
              </li>
              <li>Job applications are shared with the organization that posted the job.</li>
              <li>Beyond that, we do not share your data with third parties, and never sell it.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Cookies</h2>
            <p className="text-muted-foreground leading-relaxed">
              This site sets a session cookie to keep you signed in. Your display theme preference
              is stored locally in your browser. We do not set third-party tracking cookies.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Retention and deletion</h2>
            <p className="text-muted-foreground leading-relaxed">
              You can edit your profile details at any time in your settings. If you want your
              account deleted or deactivated, or want a copy of the data associated with you,
              contact the operator of this instance. Deleting an account deactivates its record in
              the database; the operator can tell you how long backups are kept.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Questions</h2>
            <p className="text-muted-foreground leading-relaxed">
              Every Nuvia instance is run independently of the open-source project itself. For any
              privacy question or request, contact the organization that runs this site.
            </p>
          </section>

          <section className="rounded-lg border bg-card p-5 text-sm">
            <h2 className="font-medium mb-2">About this document</h2>
            <p className="text-muted-foreground leading-relaxed">
              Nuvia is open-source software; this policy is the baseline it ships with. Instance
              operators are expected to adapt it to their organization, add their contact details,
              and adjust it to the laws that apply to them. See also the{" "}
              <Link href="/terms" className="text-primary hover:underline">
                Terms of Service
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
