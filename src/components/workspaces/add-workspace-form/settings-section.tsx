import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { WorkspaceForm } from "./types";

interface SettingsSectionProps {
  form: WorkspaceForm;
  newFileType: string;
  onNewFileTypeChange: (value: string) => void;
  onAddFileType: () => void;
  onRemoveFileType: (index: number) => void;
}

export function SettingsSection({
  form,
  newFileType,
  onNewFileTypeChange,
  onAddFileType,
  onRemoveFileType,
}: SettingsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Workspace Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="isPublic">Visibility</Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isPublic"
                  checked={form.watch("settings.isPublic")}
                  onCheckedChange={(checked) =>
                    form.setValue("settings.isPublic", checked as boolean)
                  }
                />
                <Label htmlFor="isPublic" className="text-sm font-normal">
                  Public workspace
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Public workspaces can be accessed by all organization members
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Access Control</Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="allowGuestAccess"
                  checked={form.watch("settings.allowGuestAccess")}
                  onCheckedChange={(checked) =>
                    form.setValue("settings.allowGuestAccess", checked as boolean)
                  }
                />
                <Label htmlFor="allowGuestAccess" className="text-sm font-normal">
                  Allow guest access
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="requireApproval"
                  checked={form.watch("settings.requireApproval")}
                  onCheckedChange={(checked) =>
                    form.setValue("settings.requireApproval", checked as boolean)
                  }
                />
                <Label htmlFor="requireApproval" className="text-sm font-normal">
                  Require approval to join
                </Label>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="enableNotifications">Notifications</Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="enableNotifications"
                checked={form.watch("settings.enableNotifications")}
                onCheckedChange={(checked) =>
                  form.setValue("settings.enableNotifications", checked as boolean)
                }
              />
              <Label htmlFor="enableNotifications" className="text-sm font-normal">
                Enable notifications
              </Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="autoArchiveDays">Auto Archive</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="autoArchiveDays"
                type="number"
                placeholder="365"
                {...form.register("settings.autoArchiveDays", { valueAsNumber: true })}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">days</span>
            </div>
            {form.formState.errors.settings?.autoArchiveDays && (
              <p className="text-sm text-destructive">
                {form.formState.errors.settings.autoArchiveDays.message}
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="maxFileSize">Max File Size</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="maxFileSize"
                type="number"
                placeholder="50"
                {...form.register("settings.maxFileSize", { valueAsNumber: true })}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">MB</span>
            </div>
            {form.formState.errors.settings?.maxFileSize && (
              <p className="text-sm text-destructive">
                {form.formState.errors.settings.maxFileSize.message}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Allowed File Types</Label>
          <div className="space-y-2">
            {form.watch("settings.allowedFileTypes")?.map((fileType, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={fileType}
                  onChange={(e) => {
                    const current = form.getValues("settings.allowedFileTypes") || [];
                    current[index] = e.target.value;
                    form.setValue("settings.allowedFileTypes", current);
                  }}
                  placeholder=".pdf"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onRemoveFileType(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}

            <div className="flex items-center gap-2">
              <Input
                value={newFileType}
                onChange={(e) => onNewFileTypeChange(e.target.value)}
                placeholder="Add new file type..."
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    onAddFileType();
                  }
                }}
                className="flex-1"
              />
              <Button type="button" variant="outline" size="sm" onClick={onAddFileType}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {form.formState.errors.settings?.allowedFileTypes && (
            <p className="text-sm text-destructive">
              {form.formState.errors.settings.allowedFileTypes.message}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
