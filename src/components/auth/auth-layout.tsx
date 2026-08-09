import { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
  footerText?: string;
  footerLink?: {
    text: string;
    href: string;
  };
}

/**
 * Loading component for auth pages
 */
function AuthLoading() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-background">
      <div className="text-center">
        <LoadingSpinner size="md" className="mx-auto mb-4" />
        <p className="text-muted-foreground">Checking authentication...</p>
      </div>
    </div>
  );
}

/**
 * Auth layout wrapper component
 * Provides consistent layout and styling across auth pages
 */
export function AuthLayout({ children, title, subtitle, footerText, footerLink }: AuthLayoutProps) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md">
        {/* Logo and title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-4 bg-foreground">
            <Image
              src="/logo.png"
              alt="Nuvia Logo"
              width={60}
              height={60}
              className="rounded-md"
              priority
            />
          </div>
          <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
          <p className="text-sm mt-1 text-muted-foreground">{subtitle}</p>
        </div>

        {/* Main content */}
        <div className="rounded-2xl border p-8 shadow-sm bg-card border-border">{children}</div>

        {/* Footer */}
        {footerText && footerLink && (
          <p className="text-center text-sm text-muted-foreground mt-6">
            {footerText}{" "}
            <Link href={footerLink.href} className="font-medium hover:underline text-primary">
              {footerLink.text}
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Wrapper component with Suspense boundary
 */
export function AuthLayoutWrapper(props: AuthLayoutProps) {
  return (
    <Suspense fallback={<AuthLoading />}>
      <AuthLayout {...props} />
    </Suspense>
  );
}
