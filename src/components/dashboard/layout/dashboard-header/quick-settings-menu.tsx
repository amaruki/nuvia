"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";

import { APP_THEMES } from "@/config/themes";
import {
  HelpCircle,
  Layout,
  Monitor,
  Moon,
  Palette,
  Settings,
  Shield,
  Sun,
  User,
} from "lucide-react";

export function QuickSettingsMenu() {
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Settings className="h-4 w-4" />
          <span className="sr-only">Quick Settings</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Quick Settings
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Theme Toggle */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Palette className="mr-2 h-4 w-4" />
            <span>Theme</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
              {APP_THEMES.map((option) => (
                <DropdownMenuRadioItem key={option.id} value={option.id}>
                  {option.dark ? (
                    <Moon className="mr-2 h-4 w-4" />
                  ) : (
                    <Sun className="mr-2 h-4 w-4" />
                  )}
                  {option.label}
                </DropdownMenuRadioItem>
              ))}
              <DropdownMenuRadioItem value="system">
                <Monitor className="mr-2 h-4 w-4" />
                System
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />

        {/* Quick Links */}
        <DropdownMenuItem onClick={() => router.push("/dashboard/preferences")}>
          <Layout className="mr-2 h-4 w-4" />
          <div className="flex flex-col">
            <span>Preferences</span>
            <span className="text-xs text-muted-foreground">Appearance & settings</span>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => router.push("/dashboard/profile")}>
          <User className="mr-2 h-4 w-4" />
          <div className="flex flex-col">
            <span>Profile</span>
            <span className="text-xs text-muted-foreground">Account information</span>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => router.push("/dashboard/settings/general")}>
          <Shield className="mr-2 h-4 w-4" />
          <div className="flex flex-col">
            <span>Settings</span>
            <span className="text-xs text-muted-foreground">System configuration</span>
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Help */}
        <DropdownMenuItem disabled>
          <HelpCircle className="mr-2 h-4 w-4" />
          <div className="flex flex-col">
            <span>Help & Support</span>
            <span className="text-xs text-muted-foreground">Get assistance</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
