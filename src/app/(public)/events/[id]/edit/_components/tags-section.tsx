/**
 * "Tags" section of the event edit form: the tag input with its add button
 * and the removable tag badges already attached to the event.
 */

import type { KeyboardEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";

interface TagsSectionProps {
  tags: string[];
  tagInput: string;
  onTagInputChange: (value: string) => void;
  onAddTag: () => void;
  onRemoveTag: (tag: string) => void;
  onTagKeyPress: (e: KeyboardEvent) => void;
}

export function TagsSection({
  tags,
  tagInput,
  onTagInputChange,
  onAddTag,
  onRemoveTag,
  onTagKeyPress,
}: TagsSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-foreground/90">Tags</h3>

      <div>
        <Label htmlFor="tags">Add Tags</Label>
        <div className="flex mt-1">
          <Input
            id="tags"
            value={tagInput}
            onChange={(e) => onTagInputChange(e.target.value)}
            onKeyPress={onTagKeyPress}
            placeholder="Add a tag..."
            className="flex-1"
          />
          <Button type="button" onClick={onAddTag} variant="outline" className="ml-2">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, index) => (
            <Badge key={index} variant="secondary" className="flex items-center">
              {tag}
              <button
                type="button"
                onClick={() => onRemoveTag(tag)}
                className="ml-1 text-foreground/50 hover:text-foreground/70"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
