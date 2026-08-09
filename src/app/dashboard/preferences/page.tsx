"use client";

import { useState, useEffect } from "react";
import { useHeader } from "@/contexts/dashboard-context";
import { useTheme } from "next-themes";

import { APP_THEMES } from "@/config/themes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Sun, Moon, Monitor, Palette, Bell, Globe, Shield, Check, Settings2 } from "lucide-react";

export default function PreferencesPage() {
  const { setHeader, clearHeader } = useHeader();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setHeader({
      title: "Preferences",
      description: "Customize your dashboard experience",
    });
    setMounted(true);
    return () => clearHeader();
  }, [setHeader, clearHeader]);

  if (!mounted) {
    return null;
  }

  const themeOptions = [
    ...APP_THEMES.map((option) => ({
      id: option.id,
      label: option.label,
      icon: option.dark ? Moon : Sun,
      description: option.description ?? "",
    })),
    {
      id: "system",
      label: "System",
      icon: Monitor,
      description: "Follows your device settings",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Theme Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Appearance
          </CardTitle>
          <CardDescription>Customize how the dashboard looks and feels</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="text-base font-medium">Theme</Label>
            <p className="text-sm text-muted-foreground mb-4">Select your preferred color scheme</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {themeOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = theme === option.id;
                return (
                  <button
                    key={option.id}
                    onClick={() => setTheme(option.id)}
                    className={`
                      relative flex flex-col items-center gap-3 p-6 rounded-lg border-2 transition-all
                      ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50 hover:bg-accent"
                      }
                    `}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2">
                        <Check className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <Icon
                      className={`h-8 w-8 ${isSelected ? "text-primary" : "text-muted-foreground"}`}
                    />
                    <div className="text-center">
                      <p className="font-medium">{option.label}</p>
                      <p className="text-xs text-muted-foreground mt-1">{option.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base font-medium">Compact Mode</Label>
              <p className="text-sm text-muted-foreground">
                Reduce spacing for more content on screen
              </p>
            </div>
            <Switch disabled />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base font-medium">Reduce Motion</Label>
              <p className="text-sm text-muted-foreground">
                Minimize animations throughout the interface
              </p>
            </div>
            <Switch disabled />
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>Manage how you receive notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base font-medium">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive updates via email</p>
            </div>
            <Switch disabled />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base font-medium">Push Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive browser push notifications</p>
            </div>
            <Switch disabled />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base font-medium">Sound Effects</Label>
              <p className="text-sm text-muted-foreground">Play sounds for notifications</p>
            </div>
            <Switch disabled />
          </div>
        </CardContent>
      </Card>

      {/* Language & Region */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Language & Region
          </CardTitle>
          <CardDescription>Set your language and regional preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-base font-medium">Language</Label>
            <div className="flex items-center gap-2 p-3 border rounded-lg">
              <span className="text-sm">English (United States)</span>
              <Badge variant="secondary" className="ml-auto">
                Default
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">More languages coming soon</p>
          </div>

          <div className="space-y-2">
            <Label className="text-base font-medium">Timezone</Label>
            <div className="flex items-center gap-2 p-3 border rounded-lg">
              <span className="text-sm">Asia/Jakarta (UTC+7)</span>
              <Badge variant="secondary" className="ml-auto">
                Auto-detected
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy & Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacy & Security
          </CardTitle>
          <CardDescription>Control your privacy and security settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base font-medium">Profile Visibility</Label>
              <p className="text-sm text-muted-foreground">
                Make your profile visible to other members
              </p>
            </div>
            <Switch disabled />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base font-medium">Activity Status</Label>
              <p className="text-sm text-muted-foreground">Show when you're online</p>
            </div>
            <Switch disabled />
          </div>

          <div className="pt-4">
            <Button variant="outline" disabled className="w-full">
              <Settings2 className="h-4 w-4 mr-2" />
              Advanced Security Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
