import * as React from "react"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface DashboardFooterProps {
  className?: string
}

export function DashboardFooter({ className }: DashboardFooterProps) {
  return (
    <footer className={cn("bg-card border-t mt-auto", className)}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-sm text-foreground/50">
              © {new Date().getFullYear()} Nuvia Community Platform. All rights reserved.
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-6">
            <Link href="/help" className="text-sm text-foreground/50 hover:text-foreground/70">
              Help Center
            </Link>
            <Link href="/privacy" className="text-sm text-foreground/50 hover:text-foreground/70">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-sm text-foreground/50 hover:text-foreground/70">
              Terms of Service
            </Link>
            <Link href="/contact" className="text-sm text-foreground/50 hover:text-foreground/70">
              Contact Us
            </Link>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-xs text-foreground/50">
              Built with ❤️ by the Nuvia community
            </p>
            <div className="mt-2 md:mt-0">
              <p className="text-xs text-foreground/50">
                Version 1.0.0
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}