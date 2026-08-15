import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useFormContext } from "react-hook-form";

import { CheckboxField, NumberField } from "@/components/dashboard/form-sheet";
import { Button } from "@/components/ui/button";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

/**
 * The allowed-file-types list is a string field array, a deliberate
 * shorthand escape hatch, so it composes FormField directly.
 */
export function SettingsSection() {
  const { control } = useFormContext();
  const [newFileType, setNewFileType] = useState("");

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <CheckboxField
          name="settings.isPublic"
          label="Public workspace"
          description="Public workspaces can be accessed by all organization members"
        />
        <div className="space-y-3">
          <CheckboxField name="settings.allowGuestAccess" label="Allow guest access" />
          <CheckboxField name="settings.requireApproval" label="Require approval to join" />
        </div>
      </div>

      <CheckboxField name="settings.enableNotifications" label="Enable notifications" />

      <div className="grid gap-4 md:grid-cols-2">
        <NumberField
          name="settings.autoArchiveDays"
          label="Auto archive (days)"
          placeholder="365"
          min={1}
          max={1095}
        />
        <NumberField
          name="settings.maxFileSize"
          label="Max file size (MB)"
          placeholder="50"
          min={1}
          max={1000}
        />
      </div>

      <FormField
        control={control}
        name="settings.allowedFileTypes"
        render={({ field }) => {
          const fileTypes: string[] = field.value ?? [];
          const addFileType = () => {
            const value = newFileType.trim();
            if (!value) return;
            field.onChange([...fileTypes, value]);
            setNewFileType("");
          };

          return (
            <FormItem>
              <FormLabel>
                Allowed file types<span aria-hidden="true"> *</span>
              </FormLabel>
              <FormControl>
                <div className="space-y-2">
                  {fileTypes.map((fileType, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={fileType}
                        onChange={(event) => {
                          const next = [...fileTypes];
                          next[index] = event.target.value;
                          field.onChange(next);
                        }}
                        placeholder=".pdf"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => field.onChange(fileTypes.filter((_, i) => i !== index))}
                        aria-label={`Remove file type ${index + 1}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  <div className="flex items-center gap-2">
                    <Input
                      value={newFileType}
                      onChange={(event) => setNewFileType(event.target.value)}
                      placeholder="Add new file type..."
                      aria-label="Add a file type"
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          addFileType();
                        }
                      }}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addFileType}
                      aria-label="Add file type"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          );
        }}
      />
    </div>
  );
}
