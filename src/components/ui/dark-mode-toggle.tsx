"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

import { PRIMARY_DARK_THEME_ID, PRIMARY_LIGHT_THEME_ID, isDarkTheme } from "@/config/themes";

export function DarkModeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:opacity-50 disabled:pointer-events-none hover:bg-accent hover:text-accent-foreground h-10 w-10"
        aria-label="Toggle dark mode"
        disabled
      >
        <Sun className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Toggle dark mode</span>
      </button>
    );
  }

  const isDark = isDarkTheme(resolvedTheme);
  const toggleTheme = () => setTheme(isDark ? PRIMARY_LIGHT_THEME_ID : PRIMARY_DARK_THEME_ID);

  return (
    <button
      onClick={toggleTheme}
      className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:opacity-50 disabled:pointer-events-none hover:bg-accent hover:text-accent-foreground h-10 w-10"
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      {isDark ? (
        <Sun className="h-[1.2rem] w-[1.2rem]" />
      ) : (
        <Moon className="h-[1.2rem] w-[1.2rem]" />
      )}
      <span className="sr-only">Toggle dark mode</span>
    </button>
  );
}
