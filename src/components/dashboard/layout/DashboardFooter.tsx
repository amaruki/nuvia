import * as React from "react"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface DashboardFooterProps {
  className?: string
}

export function DashboardFooter({ className }: DashboardFooterProps) {
  return (
    <footer className={cn("bg-white border-t border-gray-200 mt-auto", className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} Nuvia Community Platform. All rights reserved.
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-6">
            <Link href="/help" className="text-sm text-gray-500 hover:text-gray-700">
              Help Center
            </Link>
            <Link href="/privacy" className="text-sm text-gray-500 hover:text-gray-700">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-sm text-gray-500 hover:text-gray-700">
              Terms of Service
            </Link>
            <Link href="/contact" className="text-sm text-gray-500 hover:text-gray-700">
              Contact Us
            </Link>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-xs text-gray-500">
              Built with ❤️ by the Nuvia community
            </p>
            <div className="mt-2 md:mt-0">
              <p className="text-xs text-gray-500">
                Version 1.0.0
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}