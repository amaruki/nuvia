import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TabsContent } from "@/components/ui/tabs";
import { GatewayFormData } from "@/types/finance";

interface CredentialsTabProps {
  formData: GatewayFormData;
  updateFormData: <K extends keyof GatewayFormData>(field: K, value: GatewayFormData[K]) => void;
}

export function CredentialsTab({ formData, updateFormData }: CredentialsTabProps) {
  return (
    <TabsContent value="credentials" className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="apiKey">API Key</Label>
          <Input
            id="apiKey"
            type="password"
            placeholder="Enter API key..."
            value={formData.apiKey}
            onChange={(e) => updateFormData("apiKey", e.target.value)}
          />
          <p className="text-xs text-muted-foreground">API key for authentication</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="apiSecret">API Secret</Label>
          <Input
            id="apiSecret"
            type="password"
            placeholder="Enter API secret..."
            value={formData.apiSecret}
            onChange={(e) => updateFormData("apiSecret", e.target.value)}
          />
          <p className="text-xs text-muted-foreground">API secret for authentication</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="merchantId">Merchant ID</Label>
          <Input
            id="merchantId"
            placeholder="Enter merchant ID..."
            value={formData.merchantId}
            onChange={(e) => updateFormData("merchantId", e.target.value)}
          />
          <p className="text-xs text-muted-foreground">Merchant identifier (if applicable)</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="accountId">Account ID</Label>
          <Input
            id="accountId"
            placeholder="Enter account ID..."
            value={formData.accountId}
            onChange={(e) => updateFormData("accountId", e.target.value)}
          />
          <p className="text-xs text-muted-foreground">Account identifier (if applicable)</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="webhookUrl">Webhook URL</Label>
        <Input
          id="webhookUrl"
          placeholder="https://your-domain.com/webhooks/gateway"
          value={formData.webhookUrl}
          onChange={(e) => updateFormData("webhookUrl", e.target.value)}
        />
        <p className="text-xs text-muted-foreground">URL to receive webhook notifications</p>
      </div>
    </TabsContent>
  );
}
