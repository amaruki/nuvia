"use client";

import { Lock, Plus, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface QuickActionsCardProps {
  onNavigate: (tab: string) => void;
}

export function QuickActionsCard({ onNavigate }: QuickActionsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          className="w-full justify-start"
          variant="outline"
          onClick={() => onNavigate("users")}
        >
          <Users className="mr-2 h-4 w-4" />
          Manage User Roles
        </Button>
        <Button
          className="w-full justify-start"
          variant="outline"
          onClick={() => onNavigate("permissions")}
        >
          <Lock className="mr-2 h-4 w-4" />
          View Permissions
        </Button>
        <Button
          className="w-full justify-start"
          variant="outline"
          onClick={() => onNavigate("custom")}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Custom Role
        </Button>
      </CardContent>
    </Card>
  );
}
