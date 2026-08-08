import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TabsContent } from "@/components/ui/tabs";
import { GatewayFormData } from "@/types/finance";
import { CURRENCY_OPTIONS, PROVIDER_OPTIONS } from "./options";

interface BasicTabProps {
  formData: GatewayFormData;
  updateFormData: <K extends keyof GatewayFormData>(field: K, value: GatewayFormData[K]) => void;
}

export function BasicTab({ formData, updateFormData }: BasicTabProps) {
  return (
    <TabsContent value="basic" className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Gateway Name</Label>
          <Input
            id="name"
            placeholder="e.g., stripe_main"
            value={formData.name}
            onChange={(e) => updateFormData("name", e.target.value)}
          />
          <p className="text-xs text-muted-foreground">Internal identifier for gateway</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="displayName">Display Name</Label>
          <Input
            id="displayName"
            placeholder="e.g., Stripe (Primary)"
            value={formData.displayName}
            onChange={(e) => updateFormData("displayName", e.target.value)}
          />
          <p className="text-xs text-muted-foreground">User-friendly name shown in interface</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="provider">Provider</Label>
        <Select
          value={formData.provider}
          onValueChange={(value) => {
            // Radix Select reports string; the options above restrict it to gateway providers.
            const provider = value as GatewayFormData["provider"];
            updateFormData("provider", provider);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select provider" />
          </SelectTrigger>
          <SelectContent>
            {PROVIDER_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Optional description of this gateway..."
          value={formData.description}
          onChange={(e) => updateFormData("description", e.target.value)}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="environment">Environment</Label>
          <Select
            value={formData.environment}
            onValueChange={(value) => {
              // Radix Select reports string; the options above restrict it to environments.
              const environment = value as GatewayFormData["environment"];
              updateFormData("environment", environment);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select environment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sandbox">Sandbox</SelectItem>
              <SelectItem value="production">Production</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Currencies</Label>
          <div className="space-y-2">
            {CURRENCY_OPTIONS.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`currency-${option.value}`}
                  checked={formData.currencies?.includes(option.value) || false}
                  onCheckedChange={(checked) => {
                    const currentCurrencies = formData.currencies || [];
                    const newCurrencies = checked
                      ? [...currentCurrencies, option.value]
                      : currentCurrencies.filter((c) => c !== option.value);
                    updateFormData("currencies", newCurrencies);
                  }}
                />
                <Label
                  htmlFor={`currency-${option.value}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-row items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label className="text-base">Default Gateway</Label>
            <p className="text-xs text-muted-foreground">Set as the default payment gateway</p>
          </div>
          <Switch
            checked={formData.isDefault}
            onCheckedChange={(checked) => updateFormData("isDefault", checked)}
          />
        </div>

        <div className="flex flex-row items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label className="text-base">Enabled</Label>
            <p className="text-xs text-muted-foreground">
              Enable this gateway for processing payments
            </p>
          </div>
          <Switch
            checked={formData.isEnabled}
            onCheckedChange={(checked) => updateFormData("isEnabled", checked)}
          />
        </div>
      </div>
    </TabsContent>
  );
}
