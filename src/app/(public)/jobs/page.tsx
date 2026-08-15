import Link from "next/link";
import { Search } from "lucide-react";
import { getJobBoardMeta, listPublicJobPostings } from "@/lib/services/job";
import { JobCard } from "@/app/dashboard/jobs/_components/job-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

// Public DB-backed listing — see the matching comment in
// (public)/forums/page.tsx: the build must never query the database
// during prerender.
export const dynamic = "force-dynamic";

export default async function PublicJobBoardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : undefined;
  const type = typeof sp.type === "string" ? sp.type : undefined;

  const [result, meta] = await Promise.all([
    listPublicJobPostings({ q, typeName: type, limit: 100 }),
    getJobBoardMeta(),
  ]);
  const jobs = result.items;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-6">
        {/* Hero Section */}
        <div className="text-center py-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            Join Our Team
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Discover exciting career opportunities with leading companies worldwide
          </p>

          {/* Search Form */}
          <form action="/jobs" method="get" className="max-w-2xl mx-auto flex gap-2 mb-6">
            <div className="flex-1">
              <Input
                type="text"
                name="q"
                defaultValue={q ?? ""}
                placeholder="Search job titles, companies..."
                aria-label="Search jobs"
                className="w-full h-12"
              />
            </div>
            {type && <input type="hidden" name="type" value={type} />}
            <Button type="submit" size="lg" className="h-12 px-6">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </form>

          {/* Job Type Filters */}
          <div className="flex flex-wrap justify-center gap-2">
            <Badge
              variant={!type ? "default" : "outline"}
              className="cursor-pointer text-sm px-4 py-1.5"
            >
              <Link href="/jobs">All</Link>
            </Badge>
            {meta.types.map((t) => (
              <Badge
                key={t.id}
                variant={type === t.name ? "default" : "outline"}
                className="cursor-pointer text-sm px-4 py-1.5"
              >
                <Link href={`/jobs?type=${encodeURIComponent(t.name)}`}>{t.displayName}</Link>
              </Badge>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="mb-6 text-muted-foreground">
          {jobs.length} position{jobs.length === 1 ? "" : "s"} found
        </div>

        {jobs.length === 0 ? (
          <div className="text-center py-16 border rounded-lg bg-card">
            <h3 className="text-lg font-medium mb-2">No jobs match your search</h3>
            <p className="text-muted-foreground">
              Try adjusting your search terms or clearing the filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}

        {/* CTA Section */}
        <div className="text-center mt-16 py-12 bg-gradient-to-r from-primary/10 to-accent/60 border border-border rounded-xl">
          <h2 className="text-2xl font-bold mb-4">Don&apos;t see what you&apos;re looking for?</h2>
          <p className="text-muted-foreground mb-6">
            Check back soon — we are always looking for talented people to join our partner
            companies.
          </p>
        </div>
      </div>
    </div>
  );
}
