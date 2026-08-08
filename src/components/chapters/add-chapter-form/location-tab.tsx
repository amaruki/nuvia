import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TabsContent } from "@/components/ui/tabs";
import { timezoneOptions } from "./options";
import { ChapterForm } from "./types";

interface LocationTabProps {
  form: ChapterForm;
}

export function LocationTab({ form }: LocationTabProps) {
  return (
    <TabsContent value="location" className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="address">Street Address *</Label>
          <Input
            id="address"
            placeholder="123 Main Street"
            {...form.register("location.address")}
          />
          {form.formState.errors.location?.address && (
            <p className="text-sm text-destructive">
              {form.formState.errors.location.address.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">City *</Label>
          <Input id="city" placeholder="New York" {...form.register("location.city")} />
          {form.formState.errors.location?.city && (
            <p className="text-sm text-destructive">
              {form.formState.errors.location.city.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="state">State/Province *</Label>
          <Input id="state" placeholder="NY" {...form.register("location.state")} />
          {form.formState.errors.location?.state && (
            <p className="text-sm text-destructive">
              {form.formState.errors.location.state.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="country">Country *</Label>
          <Input id="country" placeholder="United States" {...form.register("location.country")} />
          {form.formState.errors.location?.country && (
            <p className="text-sm text-destructive">
              {form.formState.errors.location.country.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="postalCode">Postal Code *</Label>
          <Input id="postalCode" placeholder="10001" {...form.register("location.postalCode")} />
          {form.formState.errors.location?.postalCode && (
            <p className="text-sm text-destructive">
              {form.formState.errors.location.postalCode.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="region">Region *</Label>
          <Input id="region" placeholder="Northeast" {...form.register("location.region")} />
          {form.formState.errors.location?.region && (
            <p className="text-sm text-destructive">
              {form.formState.errors.location.region.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="timezone">Timezone *</Label>
        <Select
          value={form.watch("location.timezone")}
          onValueChange={(value) => form.setValue("location.timezone", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select timezone" />
          </SelectTrigger>
          <SelectContent>
            {timezoneOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.location?.timezone && (
          <p className="text-sm text-destructive">
            {form.formState.errors.location.timezone.message}
          </p>
        )}
      </div>
    </TabsContent>
  );
}
