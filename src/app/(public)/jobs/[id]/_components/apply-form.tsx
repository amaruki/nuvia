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

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useSession } from "@/lib/client";
import { useMounted } from "@/lib/hooks/use-mounted";
import {
  jobApplicationSchema,
  type JobApplicationFormInput,
  type JobApplicationFormValues,
} from "@/lib/validation/job.validation";
import { CheckCircle2, Loader2, LogIn } from "lucide-react";

interface ApplyFormProps {
  jobId: string;
  slug: string;
  applicationDeadline: string | null;
}

export function ApplyForm({ jobId, slug, applicationDeadline }: ApplyFormProps) {
  const { data: session, isPending } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const mounted = useMounted();

  const form = useForm<JobApplicationFormInput, unknown, JobApplicationFormValues>({
    resolver: zodResolver(jobApplicationSchema),
    defaultValues: {
      coverLetter: "",
      portfolioUrl: "",
      salaryExpectation: "",
      availability: "",
    },
  });
  const { isSubmitting } = form.formState;

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

  const onValid = async (data: JobApplicationFormValues) => {
    setError(null);

    try {
      // Rebuild the POST body with the same semantics as before: only include
      // trimmed non-empty values, and salaryExpectation as a Number. The raw
      // salary field value is read from form state because the zod union
      // coerces an empty string to 0, which would otherwise be ambiguous.
      const body: Record<string, unknown> = {};
      const coverLetter = data.coverLetter?.trim();
      if (coverLetter) body.coverLetter = coverLetter;
      const portfolioUrl = data.portfolioUrl?.trim();
      if (portfolioUrl) body.portfolioUrl = portfolioUrl;
      const salaryExpectation = form.getValues("salaryExpectation");
      if (salaryExpectation !== "" && salaryExpectation !== undefined) {
        body.salaryExpectation = Number(salaryExpectation);
      }
      const availability = data.availability?.trim();
      if (availability) body.availability = availability;

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
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Apply for this role</CardTitle>
        <CardDescription>
          {applicationDeadline
            ? `You are applying as ${session.user.email}. Applications close ${new Date(
                applicationDeadline,
              ).toLocaleDateString()}.`
            : `You are applying as ${session.user.email}.`}
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onValid)}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <FormField
              control={form.control}
              name="coverLetter"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cover Letter</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell the hiring team why you are a great fit..."
                      className="min-h-[160px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="portfolioUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Portfolio URL (optional)</FormLabel>
                  <FormControl>
                    <Input type="url" placeholder="https://your-portfolio.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="salaryExpectation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Salary Expectation (optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="e.g. 75000"
                        {...field}
                        value={field.value as number}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="availability"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Availability (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Two weeks notice" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Application"
              )}
            </Button>
          </CardContent>
        </form>
      </Form>
    </Card>
  );
}
