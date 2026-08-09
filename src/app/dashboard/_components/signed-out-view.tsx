/**
 * Signed-out state for `/dashboard` (extracted verbatim from the former
 * client page so unauthenticated visitors keep the same prompt).
 */

"use client";

import { useRouter } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export function SignedOutView() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <AlertCircle className="h-12 w-12 text-muted-foreground" />
      <Alert variant="destructive" className="max-w-md">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>You must be logged in to access the dashboard.</AlertDescription>
      </Alert>
      <div className="flex gap-4">
        <button
          onClick={() => router.push("/auth/login")}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Sign In
        </button>
        <button
          onClick={() => router.push("/auth/signup")}
          className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
        >
          Sign Up
        </button>
      </div>
    </div>
  );
}
