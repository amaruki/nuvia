"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Command, Search } from "lucide-react";

export function HeaderSearch() {
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isSearchOpen) {
      searchInputRef.current?.focus();
    }
  }, [isSearchOpen]);

  return (
    <>
      {/* Desktop search */}
      <div className="relative hidden md:flex items-center">
        {isSearchOpen ? (
          <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2 duration-200">
            <Input
              type="search"
              placeholder="Search..."
              className="h-9 w-64 pr-8"
              ref={searchInputRef}
              onBlur={() => setIsSearchOpen(false)}
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 h-9 w-9"
              onClick={() => setIsSearchOpen(false)}
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => setIsSearchOpen(true)}
          >
            <Search className="h-4 w-4" />
            <span className="sr-only">Search</span>
          </Button>
        )}
      </div>

      {/* Command Menu - Mobile Search */}
      <Button variant="ghost" size="icon" className="h-9 w-9 md:hidden">
        <Command className="h-4 w-4" />
        <span className="sr-only">Open command menu</span>
      </Button>
    </>
  );
}
