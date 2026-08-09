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
import { CreditCard } from "lucide-react";

export default function BillingTab() {
  return (
    <TabsContent value="billing" className="space-y-4 mt-6">
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <CreditCard className="w-5 h-5 text-muted-foreground" />
          <div>
            <h3 className="font-medium">Billing Settings</h3>
            <p className="text-sm text-muted-foreground">Configure payment and billing options</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <Label htmlFor="billingCycle">Default Billing Cycle</Label>
            <Select defaultValue="monthly">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="annually">Annually</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lateFee">Late Fee Percentage</Label>
            <Input id="lateFee" type="number" defaultValue="10" placeholder="10" min="0" max="50" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gracePeriod">Grace Period (Days)</Label>
            <Input
              id="gracePeriod"
              type="number"
              defaultValue="7"
              placeholder="7"
              min="0"
              max="30"
            />
          </div>
        </div>
      </div>
    </TabsContent>
  );
}
