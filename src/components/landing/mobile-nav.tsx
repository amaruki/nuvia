"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const SECTIONS = [
  { href: "#features", label: "Features" },
  { href: "#modules", label: "Modules" },
  { href: "#community", label: "Community" },
  { href: "#contribute", label: "Contribute" },
] as const;

/** Mobile-only section navigation for the landing page. Hidden on md+ where
    the inline nav renders. */
export function MobileNav() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="flex w-72 flex-col">
        <SheetHeader className="text-left">
          <SheetTitle>Nuvia</SheetTitle>
          <SheetDescription>Jump to a section, or sign in to the app.</SheetDescription>
        </SheetHeader>
        <nav aria-label="Page sections" className="mt-4 flex flex-col gap-1">
          {SECTIONS.map((section) => (
            <SheetClose key={section.href} asChild>
              <Link
                href={section.href}
                className="rounded-md px-3 py-2.5 text-base font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                {section.label}
              </Link>
            </SheetClose>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-2 border-t pt-4">
          <SheetClose asChild>
            <Button variant="ghost" asChild className="w-full justify-start">
              <Link href="/auth/login">Sign in</Link>
            </Button>
          </SheetClose>
          <SheetClose asChild>
            <Button asChild className="w-full">
              <Link href="/auth/signup">Get started</Link>
            </Button>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
}
