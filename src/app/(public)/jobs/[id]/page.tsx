import Link from "next/link";
import { ArrowLeft, Clock, DollarSign, MapPin, Briefcase, Calendar } from "lucide-react";
import { getPublicJobPostingBySlug } from "@/lib/services/job";
import { ApplyForm } from "./_components/apply-form";
import { CompanyNameLink } from "./_components/company-link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  EMPLOYMENT_TYPE_LABELS,
  EXPERIENCE_LEVEL_LABELS,
  formatDate,
  formatSalary,
} from "@/types/jobs.types";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function PublicJobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await getPublicJobPostingBySlug(id);

  if (!job) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Job not found</h1>
          <p className="text-muted-foreground mb-6">
            The job you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Link href="/jobs" className="text-blue-600 dark:text-blue-400 hover:underline">
            Back to Job Board
          </Link>
        </div>
      </div>
    );
  }

  const closed = job.applicationDeadline !== null && new Date(job.applicationDeadline) < new Date();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/jobs"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to jobs
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">{job.title}</h1>
              <p className="text-xl text-muted-foreground mb-4">
                <CompanyNameLink companyId={job.companyId} name={job.companyName} />
              </p>
              <div className="flex items-center gap-4 text-muted-foreground">
                <span className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  {job.locationName}
                </span>
                <span className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {EMPLOYMENT_TYPE_LABELS[job.employmentType]}
                </span>
                <span className="flex items-center">
                  <Briefcase className="h-4 w-4 mr-1" />
                  {EXPERIENCE_LEVEL_LABELS[job.experienceLevel]}
                </span>
              </div>
            </div>
          </div>
          {job.isFeatured && (
            <Badge variant="secondary" className="mt-4">
              Featured Position
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>About the Role</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="leading-relaxed whitespace-pre-wrap text-muted-foreground">
                    {job.description}
                  </p>
                </CardContent>
              </Card>

              {job.responsibilities && (
                <Card>
                  <CardHeader>
                    <CardTitle>Responsibilities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="leading-relaxed whitespace-pre-wrap text-muted-foreground">
                      {job.responsibilities}
                    </p>
                  </CardContent>
                </Card>
              )}

              {job.requirements && (
                <Card>
                  <CardHeader>
                    <CardTitle>Requirements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="leading-relaxed whitespace-pre-wrap text-muted-foreground">
                      {job.requirements}
                    </p>
                  </CardContent>
                </Card>
              )}

              {job.benefits && (
                <Card>
                  <CardHeader>
                    <CardTitle>Benefits</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="leading-relaxed whitespace-pre-wrap text-muted-foreground">
                      {job.benefits}
                    </p>
                  </CardContent>
                </Card>
              )}

              {closed ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Applications closed</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      The application deadline for this position was{" "}
                      {formatDate(job.applicationDeadline)}. Please check out our other open roles.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <ApplyForm
                  jobId={job.id}
                  slug={job.slug}
                  applicationDeadline={job.applicationDeadline}
                />
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Job Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Location</span>
                  <span className="font-medium">{job.locationName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Job Type</span>
                  <span className="font-medium">{EMPLOYMENT_TYPE_LABELS[job.employmentType]}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Experience Level</span>
                  <span className="font-medium">
                    {EXPERIENCE_LEVEL_LABELS[job.experienceLevel]}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Salary Range</span>
                  <span className="font-medium">
                    {formatSalary(job.salaryMin, job.salaryMax, job.currency)}
                  </span>
                </div>
                {job.applicationDeadline && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Deadline</span>
                    <span className="font-medium">{formatDate(job.applicationDeadline)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Posted</span>
                  <span className="font-medium">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    {formatDate(job.publishedAt ?? job.createdAt)}
                  </span>
                </div>
                {job.isRemote && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Remote</span>
                    <span className="font-medium text-green-700 dark:text-green-400">
                      Remote friendly
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">About the Company</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{job.companyName}</p>
                {job.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {job.tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <DollarSign className="h-6 w-6 mx-auto mb-2 text-green-600" />
              <p className="text-sm text-muted-foreground">
                Competitive compensation and benefits package included
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
