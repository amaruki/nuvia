"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const SETTINGS_TABS = [
  { title: "General", href: "/dashboard/settings/general" },
  { title: "Email", href: "/dashboard/settings/email" },
  { title: "Security", href: "/dashboard/settings/security" },
  { title: "OAuth", href: "/dashboard/settings/oauth" },
  { title: "Payments", href: "/dashboard/settings/payments" },
] as const;

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Settings sections" className="border-b">
      <ul className="flex flex-wrap gap-1">
        {SETTINGS_TABS.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "inline-block rounded-t-md border-b-2 px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.title}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
