"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check } from "lucide-react";
import { tagOptions } from "./options";

interface TagFilterProps {
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  onAddTag: (tag: string) => void;
}

export function TagFilter({ selectedTags, onToggleTag, onAddTag }: TagFilterProps) {
  const [tagInputValue, setTagInputValue] = React.useState("");

  const handleAddTag = () => {
    const trimmed = tagInputValue.trim();
    if (trimmed && !selectedTags.includes(trimmed)) {
      onAddTag(trimmed);
      setTagInputValue("");
    }
  };

  return (
    <div>
      <Label className="text-sm font-medium mb-3 text-muted-foreground">Tags</Label>
      <div className="mb-3">
        <div className="flex gap-2">
          <Input
            value={tagInputValue}
            onChange={(e) => setTagInputValue(e.target.value)}
            placeholder="Add a custom tag..."
            className="flex-1"
            onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
            aria-describedby="tag-input-description"
          />
          <span id="tag-input-description" className="sr-only">
            Press Enter to add tag
          </span>
          <Button type="button" onClick={handleAddTag} size="sm" aria-label="Add tag">
            Add
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by tags">
        {tagOptions.map((tag) => (
          <Button
            key={tag}
            type="button"
            variant={selectedTags.includes(tag) ? "default" : "outline"}
            size="sm"
            onClick={() => onToggleTag(tag)}
            className="text-xs"
            aria-pressed={selectedTags.includes(tag)}
          >
            {selectedTags.includes(tag) && <Check className="h-3 w-3 mr-1" />}
            {tag}
          </Button>
        ))}
      </div>
    </div>
  );
}
