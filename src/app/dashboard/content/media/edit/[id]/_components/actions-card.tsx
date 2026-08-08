"use client";

import { Eye, Save, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ActionsCardProps {
  mediaUrl: string;
  isSaving: boolean;
  isLoading: boolean;
  onSave: () => void;
  onPreview: () => void;
}

/** Sidebar card with the save, preview and download-original actions. */
export function ActionsCard({
  mediaUrl,
  isSaving,
  isLoading,
  onSave,
  onPreview,
}: ActionsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button onClick={onSave} disabled={isSaving || isLoading} className="w-full">
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>

        <Button variant="outline" onClick={onPreview} className="w-full">
          <Eye className="h-4 w-4 mr-2" />
          Preview Media
        </Button>

        <Button
          variant="outline"
          onClick={() => window.open(mediaUrl, "_blank")}
          className="w-full"
        >
          <Upload className="h-4 w-4 mr-2" />
          Download Original
        </Button>
      </CardContent>
    </Card>
  );
}
