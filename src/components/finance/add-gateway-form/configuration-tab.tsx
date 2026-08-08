import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { GatewayConfiguration, GatewayFormData } from "@/types/finance";

interface ConfigurationTabProps {
  formData: GatewayFormData;
  updateConfiguration: <K extends keyof GatewayConfiguration>(
    field: K,
    value: GatewayConfiguration[K],
  ) => void;
}

export function ConfigurationTab({ formData, updateConfiguration }: ConfigurationTabProps) {
  return (
    <TabsContent value="configuration" className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payment Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label className="text-base">Partial Payments</Label>
                <p className="text-xs text-muted-foreground">Allow partial payment processing</p>
              </div>
              <Switch
                checked={formData.configuration.allowPartialPayments}
                onCheckedChange={(checked) => updateConfiguration("allowPartialPayments", checked)}
              />
            </div>

            <div className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label className="text-base">Require CVV</Label>
                <p className="text-xs text-muted-foreground">Require CVV for card payments</p>
              </div>
              <Switch
                checked={formData.configuration.requireCvv}
                onCheckedChange={(checked) => updateConfiguration("requireCvv", checked)}
              />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label className="text-base">Require 3DS</Label>
                <p className="text-xs text-muted-foreground">Require 3D Secure authentication</p>
              </div>
              <Switch
                checked={formData.configuration.require3ds}
                onCheckedChange={(checked) => updateConfiguration("require3ds", checked)}
              />
            </div>

            <div className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label className="text-base">Auto Capture</Label>
                <p className="text-xs text-muted-foreground">Automatically capture payments</p>
              </div>
              <Switch
                checked={formData.configuration.autoCapture}
                onCheckedChange={(checked) => updateConfiguration("autoCapture", checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Transaction Limits</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="minTransactionAmount">Minimum Transaction Amount</Label>
              <Input
                id="minTransactionAmount"
                type="number"
                step="0.01"
                placeholder="0.50"
                value={formData.configuration.minTransactionAmount}
                onChange={(e) =>
                  updateConfiguration("minTransactionAmount", parseFloat(e.target.value))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxTransactionAmount">Maximum Transaction Amount</Label>
              <Input
                id="maxTransactionAmount"
                type="number"
                step="0.01"
                placeholder="10000"
                value={formData.configuration.maxTransactionAmount}
                onChange={(e) =>
                  updateConfiguration("maxTransactionAmount", parseFloat(e.target.value))
                }
              />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dailyTransactionLimit">Daily Transaction Limit</Label>
              <Input
                id="dailyTransactionLimit"
                type="number"
                step="0.01"
                placeholder="50000"
                value={formData.configuration.dailyTransactionLimit}
                onChange={(e) =>
                  updateConfiguration("dailyTransactionLimit", parseFloat(e.target.value))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthlyTransactionLimit">Monthly Transaction Limit</Label>
              <Input
                id="monthlyTransactionLimit"
                type="number"
                step="0.01"
                placeholder="1000000"
                value={formData.configuration.monthlyTransactionLimit}
                onChange={(e) =>
                  updateConfiguration("monthlyTransactionLimit", parseFloat(e.target.value))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
