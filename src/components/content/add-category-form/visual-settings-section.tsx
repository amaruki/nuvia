import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { CATEGORY_COLORS } from "@/types/category.types";

import type { VisualSettingsSectionProps } from "./types";

export function VisualSettingsSection({
  form,
  selectedColor,
  useEmoji,
  onColorSelect,
  onToggleEmojiMode,
}: VisualSettingsSectionProps) {
  return (
    <div className="space-y-4">
      <Label>Visual Appearance</Label>

      {/* Color Selection */}
      <div className="space-y-2">
        <Label>Color</Label>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_COLORS.map((color) => (
            <button
              key={color.value}
              type="button"
              onClick={() => onColorSelect(color.value)}
              className={cn(
                "w-8 h-8 rounded-lg border-2 transition-all",
                selectedColor === color.value
                  ? "border-primary scale-110"
                  : "border-muted hover:border-muted-foreground",
              )}
              style={{ backgroundColor: color.value }}
              title={color.name}
              aria-label={color.name}
            />
          ))}
        </div>
      </div>

      {/* Icon/Emoji Selection */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Icon Type</Label>
          <Button type="button" variant="outline" size="sm" onClick={onToggleEmojiMode}>
            {useEmoji ? "Use Icon" : "Use Emoji"}
          </Button>
        </div>

        {useEmoji ? (
          <div className="space-y-2">
            <Label htmlFor="emoji">Emoji</Label>
            <Input
              id="emoji"
              {...form.register("emoji")}
              placeholder="📁"
              maxLength={2}
              className={cn(form.formState.errors.emoji && "border-red-500")}
            />
            {form.formState.errors.emoji && (
              <p className="text-sm text-red-500">{form.formState.errors.emoji.message}</p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="icon">Icon Name</Label>
            <Input
              id="icon"
              {...form.register("icon")}
              placeholder="folder"
              className={cn(form.formState.errors.icon && "border-red-500")}
            />
            <p className="text-xs text-muted-foreground">
              Use Lucide React icon names (e.g., folder, book, calendar)
            </p>
            {form.formState.errors.icon && (
              <p className="text-sm text-red-500">{form.formState.errors.icon.message}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
