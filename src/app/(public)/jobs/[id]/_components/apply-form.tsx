"use client";

/**
 * Public application form.
 *
 * B6 decision: applying to a job REQUIRES LOGIN. job_applications.user_id is
 * a NOT NULL foreign key, applicants need an identity to follow their own
 * application status, and authenticated sessions already provide the spam
 * control an anonymous endpoint would need. Unauthenticated visitors are
 * routed to the login page and returned here afterwards.
 */

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSession } from "@/lib/client";
import { useMounted } from "@/lib/hooks/use-mounted";
import { CheckCircle2, LogIn } from "lucide-react";

interface ApplyFormProps {
  jobId: string;
  slug: string;
  applicationDeadline: string | null;
}

export function ApplyForm({ jobId, slug, applicationDeadline }: ApplyFormProps) {
  const { data: session, isPending } = useSession();
  const [coverLetter, setCoverLetter] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [salaryExpectation, setSalaryExpectation] = useState("");
  const [availability, setAvailability] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const mounted = useMounted();

  if (!mounted || isPending) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Apply for this role</CardTitle>
          <CardDescription>Checking your session...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!session?.user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Apply for this role</CardTitle>
          <CardDescription>
            Sign in to submit your application and track its status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild size="lg" className="w-full">
            <Link href={`/auth/login?redirectTo=${encodeURIComponent(`/jobs/${slug}`)}`}>
              <LogIn className="mr-2 h-4 w-4" />
              Sign in to apply
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (submitted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Application submitted
          </CardTitle>
          <CardDescription>
            Thank you for applying. You will hear back from the hiring team soon.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const body: Record<string, unknown> = {};
      if (coverLetter.trim()) body.coverLetter = coverLetter.trim();
      if (portfolioUrl.trim()) body.portfolioUrl = portfolioUrl.trim();
      if (salaryExpectation !== "") body.salaryExpectation = Number(salaryExpectation);
      if (availability.trim()) body.availability = availability.trim();

      const res = await fetch(`/api/v1/jobs/${jobId}/applications`, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const problem = (await res.json().catch(() => null)) as {
          detail?: string;
          title?: string;
        } | null;
        if (res.status === 409) {
          setError("You have already applied to this job.");
        } else {
          setError(problem?.detail ?? problem?.title ?? "Failed to submit your application.");
        }
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Something went wrong while submitting your application. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Apply for this role</CardTitle>
        <CardDescription>
          You are applying as {session.user.email}
          {applicationDeadline
            ? ` — applications close ${new Date(applicationDeadline).toLocaleDateString()}`
            : ""}
          .
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="coverLetter">Cover Letter</Label>
            <Textarea
              id="coverLetter"
              placeholder="Tell the hiring team why you are a great fit..."
              className="min-h-[160px]"
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="portfolioUrl">Portfolio URL (optional)</Label>
            <Input
              id="portfolioUrl"
              type="url"
              placeholder="https://your-portfolio.com"
              value={portfolioUrl}
              onChange={(e) => setPortfolioUrl(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="salaryExpectation">Salary Expectation (optional)</Label>
              <Input
                id="salaryExpectation"
                type="number"
                min="0"
                placeholder="e.g. 75000"
                value={salaryExpectation}
                onChange={(e) => setSalaryExpectation(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="availability">Availability (optional)</Label>
              <Input
                id="availability"
                placeholder="e.g. Two weeks notice"
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
              />
            </div>
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Application"}
          </Button>
        </CardContent>
      </form>
    </Card>
  );
}
