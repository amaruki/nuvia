import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CATEGORY_COLORS } from "@/types/category.types";

import type { VisualSettingsSectionProps } from "./types";
import { CategoryIconPicker } from "./icon-picker";

/**
 * Color swatches and the icon picker are custom widgets (escape hatch);
 * the emoji input stays a standard FormField composition.
 */
export function VisualSettingsSection({
  form,
  selectedColor,
  useEmoji,
  onColorSelect,
  onToggleEmojiMode,
}: VisualSettingsSectionProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <FormLabel>Color</FormLabel>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Category color">
          {CATEGORY_COLORS.map((color) => (
            <button
              key={color.value}
              type="button"
              onClick={() => onColorSelect(color.value)}
              aria-pressed={selectedColor === color.value}
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

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <FormLabel>Icon type</FormLabel>
          <Button type="button" variant="outline" size="sm" onClick={onToggleEmojiMode}>
            {useEmoji ? "Use Icon" : "Use Emoji"}
          </Button>
        </div>

        {useEmoji ? (
          <FormField
            control={form.control}
            name="emoji"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Emoji</FormLabel>
                <FormControl>
                  <Input placeholder="📁" maxLength={2} autoComplete="off" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : (
          <CategoryIconPicker form={form} />
        )}
      </div>
    </div>
  );
}
