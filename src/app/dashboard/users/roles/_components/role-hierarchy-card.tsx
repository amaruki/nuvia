"use client";

import type { ComponentProps } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface RoleHierarchyEntry {
  label: string;
  badge: string;
  variant: ComponentProps<typeof Badge>["variant"];
}

const ROLE_HIERARCHY: RoleHierarchyEntry[] = [
  { label: "Super Admin", badge: "Full Access", variant: "destructive" },
  { label: "Admin", badge: "Admin Access", variant: "default" },
  { label: "Staff", badge: "Staff Access", variant: "secondary" },
  { label: "Leadership", badge: "Limited Admin", variant: "outline" },
  { label: "Members", badge: "Basic Access", variant: "outline" },
];

export function RoleHierarchyCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Role Hierarchy</CardTitle>
        <CardDescription>Understanding role privileges and access levels</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {ROLE_HIERARCHY.map((entry) => (
            <div key={entry.label} className="flex items-center justify-between p-2 border rounded">
              <span className="font-medium">{entry.label}</span>
              <Badge variant={entry.variant}>{entry.badge}</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
