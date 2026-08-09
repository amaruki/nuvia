"use client";

interface FormMessageProps {
  type: "success" | "error";
  message: string;
  className?: string;
}

/**
 * Form message component for success/error states
 * Provides consistent styling across auth pages
 */
export function FormMessage({ type, message, className = "" }: FormMessageProps) {
  const isError = type === "error";
  const baseClasses = "mb-6 p-3 rounded-lg border text-sm";
  // Success text intentionally uses text-foreground: --primary is a light tint
  // (~0.8 oklch lightness) that fails 4.5:1 contrast on the light auth pages.
  const typeClasses = isError
    ? "bg-destructive/10 border-destructive/30 text-destructive"
    : "bg-primary/10 border-primary/30 text-foreground";

  return (
    <div
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
      className={`${baseClasses} ${typeClasses} ${className}`}
    >
      <p>{message}</p>
    </div>
  );
}
