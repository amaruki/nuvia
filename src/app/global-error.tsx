"use client";

/**
 * Last-resort error boundary (UI-20). Renders when the root layout itself
 * has thrown, so it must provide its own <html> and <body>. Kept to plain
 * semantic markup styled only with theme tokens: if styles fail to load the
 * browser defaults stay readable and the reload button still works.
 */
export default function GlobalError() {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <main className="flex min-h-screen items-center justify-center p-6">
          <div className="max-w-md text-center">
            <h1 className="mb-2 text-2xl font-bold">Something went wrong</h1>
            <p className="mb-6 text-muted-foreground">
              An unexpected error occurred while loading the site. Please reload the page — if the
              problem persists, we are working on it.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Reload page
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
