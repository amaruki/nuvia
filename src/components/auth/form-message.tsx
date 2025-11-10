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
  const baseClasses = "mb-6 p-3 rounded-lg border text-sm";
  const typeClasses = type === "success"
    ? "bg-primary/10 border-primary/30 text-primary"
    : "bg-destructive/10 border-destructive/30 text-destructive";

  return (
    <div className={`${baseClasses} ${typeClasses} ${className}`}>
      <p>{message}</p>
    </div>
  );
}