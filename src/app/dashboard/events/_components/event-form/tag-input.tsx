"use client";

import { useState, type KeyboardEvent } from "react";

import { Plus, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface TagInputProps {
  /** Id applied to the text input so a FormLabel can point at it. */
  id?: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  disabled?: boolean;
}

/**
 * Tag entry widget: a text input that adds a tag on Enter or the Add
 * button, plus removable chips for each chosen tag. Shared by the event
 * form sheet's create and edit modes.
 */
export function TagInput({ id, tags, onChange, disabled }: TagInputProps) {
  const [draft, setDraft] = useState("");

  const addDraft = () => {
    const value = draft.trim();
    if (value && !tags.includes(value)) {
      onChange([...tags, value]);
    }
    setDraft("");
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addDraft();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex">
        <Input
          id={id}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a tag..."
          disabled={disabled}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          onClick={addDraft}
          aria-label="Add tag"
          disabled={disabled}
          className="ml-2"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {tags.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="flex items-center">
              {tag}
              <button
                type="button"
                onClick={() => onChange(tags.filter((item) => item !== tag))}
                aria-label={`Remove tag ${tag}`}
                className="ml-1 text-foreground/50 hover:text-foreground/70"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  );
}
