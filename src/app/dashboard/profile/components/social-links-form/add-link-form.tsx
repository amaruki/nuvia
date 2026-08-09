import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";

import { socialPlatforms, type SocialLink, type SocialPlatform } from "./platforms";

interface AddLinkFormProps {
  newLink: Partial<SocialLink>;
  onNewLinkChange: (next: Partial<SocialLink>) => void;
  onAdd: () => void;
  onCancel: () => void;
}

export function AddLinkForm({ newLink, onNewLinkChange, onAdd, onCancel }: AddLinkFormProps) {
  return (
    <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
      <h4 className="text-sm font-medium">Add New Link</h4>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="platform">Platform</Label>
          <Select
            value={newLink.platform}
            onValueChange={(value) =>
              onNewLinkChange({
                ...newLink,
                platform: value as SocialPlatform,
              })
            }
          >
            <SelectTrigger id="platform" className="w-full">
              <SelectValue placeholder="Select platform" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(socialPlatforms).map(([key, platform]) => (
                <SelectItem key={key} value={key}>
                  {platform.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="label">Custom Label (Optional)</Label>
          <Input
            id="label"
            placeholder="My Portfolio"
            value={newLink.label || ""}
            onChange={(e) =>
              onNewLinkChange({
                ...newLink,
                label: e.target.value,
              })
            }
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="url">URL</Label>
        <Input
          id="url"
          placeholder={socialPlatforms[newLink.platform as SocialPlatform]?.baseUrl}
          value={newLink.url || ""}
          onChange={(e) =>
            onNewLinkChange({
              ...newLink,
              url: e.target.value,
            })
          }
        />
      </div>

      <div className="flex gap-2">
        <Button onClick={onAdd} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Link
        </Button>
        <Button variant="outline" onClick={onCancel} size="sm">
          Cancel
        </Button>
      </div>
    </div>
  );
}
