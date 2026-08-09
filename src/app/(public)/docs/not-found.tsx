import Link from "next/link";

export default function DocsNotFound() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-3xl flex-col items-center px-6 py-24 text-center">
        <p className="rounded-full border border-border bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
          404
        </p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground">
          Documentation not found
        </h1>
        <p className="mt-3 max-w-md text-muted-foreground">
          This documentation page does not exist. Nothing is invented to fill the gap — browse the
          documentation index to see what is actually written.
        </p>
        <div className="mt-8 flex gap-4">
          <Link
            href="/docs"
            className="rounded-md border border-border bg-card px-4 py-2 font-medium text-foreground hover:bg-accent"
          >
            Documentation index
          </Link>
          <Link
            href="/"
            className="rounded-md px-4 py-2 font-medium text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
