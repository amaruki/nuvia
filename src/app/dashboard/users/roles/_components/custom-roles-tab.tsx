"use client";

import { Plus, Shield } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function CustomRolesTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Custom Roles
        </CardTitle>
        <CardDescription>
          Create and manage custom roles with specific permission sets.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Custom Role Management</h3>
          <p className="text-muted-foreground mb-4">
            Create custom roles with specific permission combinations that fit your organization's
            needs.
          </p>
          <Button>Create Custom Role</Button>
        </div>
      </CardContent>
    </Card>
  );
}
