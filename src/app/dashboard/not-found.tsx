"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileQuestion, Home, ArrowLeft } from "lucide-react";
import { useHeader } from "@/contexts/dashboard-context";
import { useEffect } from "react";

export default function DashboardNotFound() {
  // Set the header for this page
  const { setHeader, clearHeader } = useHeader();
  useEffect(() => {
    setHeader({
      title: "Page Not Found",
      description: "The dashboard page you're looking for doesn't exist or has been moved.",
    });

    return () => {
      clearHeader();
    };
  }, [setHeader, clearHeader]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
      {/* 404 Icon */}
      <div className="relative">
        <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center">
          <FileQuestion className="w-16 h-16 text-muted-foreground" />
        </div>
      </div>

      {/* Error Message */}
      <div className="text-center space-y-2">
        <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
        <h2 className="text-2xl font-semibold">Page Not Found</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          The dashboard page you're looking for doesn't exist or has been moved.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        <Button asChild variant="default" className="w-full sm:w-auto">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Home className="w-4 h-4" />
            Dashboard Home
          </Link>
        </Button>

        <Button asChild variant="outline" className="w-full sm:w-auto">
          <Link href="/" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Site
          </Link>
        </Button>
      </div>

      {/* Helpful Links */}
      <div className="text-center text-sm text-muted-foreground">
        <p>If you believe this is an error, please contact support.</p>
      </div>
    </div>
  );
}
