import * as React from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ContactLink, OrganizationCopyright } from "./organization-branding";

interface DashboardFooterProps {
  className?: string;
}

export function DashboardFooter({ className }: DashboardFooterProps) {
  return (
    <footer className={cn("bg-card border-t mt-auto", className)}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <OrganizationCopyright />
          </div>

          <div className="flex flex-wrap justify-center gap-6">
            <Link href="/help" className="text-sm text-foreground/75 hover:text-foreground/90">
              Help Center
            </Link>
            <Link href="/privacy" className="text-sm text-foreground/75 hover:text-foreground/90">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-sm text-foreground/75 hover:text-foreground/90">
              Terms of Service
            </Link>
            <ContactLink />
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-xs text-foreground/75">Built with ❤️ by the Nuvia community</p>
            <div className="mt-2 md:mt-0">
              <p className="text-xs text-foreground/75">Version 1.0.0</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
