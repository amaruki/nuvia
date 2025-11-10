"use client";

interface FormDividerProps {
  text: string;
  className?: string;
}

/**
 * Form divider component with text
 * Provides consistent styling across auth pages
 */
export function FormDivider({ text, className = "" }: FormDividerProps) {
  return (
    <div className={`relative my-6 ${className}`}>
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-border"></div>
      </div>
      <div className="relative flex justify-center text-sm">
        <span className="bg-card px-4 text-foreground">
          {text}
        </span>
      </div>
    </div>
  );
}