"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GatewayFormData, TransactionFee } from "@/types/finance.types";
import { Plus, Trash2, CreditCard, Wallet, Banknote, Clock } from "lucide-react";

interface AddGatewayFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: GatewayFormData) => void;
  initialData?: Partial<GatewayFormData>;
  isEditing?: boolean;
}

const CURRENCY_OPTIONS = [
  { value: "USD", label: "USD - US Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - British Pound" },
  { value: "CAD", label: "CAD - Canadian Dollar" },
  { value: "AUD", label: "AUD - Australian Dollar" },
  { value: "JPY", label: "JPY - Japanese Yen" },
];

const PROVIDER_OPTIONS = [
  { value: "stripe", label: "Stripe" },
  { value: "paypal", label: "PayPal" },
  { value: "square", label: "Square" },
  { value: "adyen", label: "Adyen" },
  { value: "razorpay", label: "Razorpay" },
  { value: "mollie", label: "Mollie" },
  { value: "other", label: "Other" },
];

const PAYMENT_METHOD_OPTIONS = [
  { value: "credit_card", label: "Credit Card", icon: CreditCard },
  { value: "debit_card", label: "Debit Card", icon: CreditCard },
  { value: "bank_transfer", label: "Bank Transfer", icon: Banknote },
  { value: "digital_wallet", label: "Digital Wallet", icon: Wallet },
  { value: "buy_now_pay_later", label: "Buy Now Pay Later", icon: Clock },
];

export function AddGatewayForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  isEditing = false,
}: AddGatewayFormProps) {
  const [activeTab, setActiveTab] = useState("basic");
  const [fees, setFees] = useState<Partial<TransactionFee>[]>([]);
  const [formData, setFormData] = useState<GatewayFormData>({
    name: "",
    provider: "stripe",
    displayName: "",
    description: "",
    environment: "sandbox",
    currencies: ["USD"],
    apiKey: "",
    apiSecret: "",
    merchantId: "",
    accountId: "",
    webhookUrl: "",
    isDefault: false,
    isEnabled: true,
    configuration: {
      allowPartialPayments: false,
      requireCvv: true,
      require3ds: false,
      autoCapture: true,
      settlementDelay: 48,
      refundPolicy: "full",
      disputeManagement: true,
      fraudDetection: true,
      recurringPayments: false,
      subscriptionSupport: false,
      maxTransactionAmount: 10000,
      minTransactionAmount: 0.5,
      dailyTransactionLimit: 50000,
      monthlyTransactionLimit: 1000000,
      webhookRetries: 3,
      timeoutDuration: 30,
    },
    transactionFees: [],
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        provider: initialData.provider || "stripe",
        displayName: initialData.displayName || "",
        description: initialData.description || "",
        environment: initialData.environment || "sandbox",
        currencies: initialData.currencies || ["USD"],
        apiKey: initialData.apiKey || "",
        apiSecret: initialData.apiSecret || "",
        merchantId: initialData.merchantId || "",
        accountId: initialData.accountId || "",
        webhookUrl: initialData.webhookUrl || "",
        isDefault: initialData.isDefault || false,
        isEnabled: initialData.isEnabled !== undefined ? initialData.isEnabled : true,
        configuration: {
          allowPartialPayments: initialData.configuration?.allowPartialPayments ?? false,
          requireCvv: initialData.configuration?.requireCvv ?? true,
          require3ds: initialData.configuration?.require3ds ?? false,
          autoCapture: initialData.configuration?.autoCapture ?? true,
          settlementDelay: initialData.configuration?.settlementDelay ?? 48,
          refundPolicy: initialData.configuration?.refundPolicy ?? "full",
          disputeManagement: initialData.configuration?.disputeManagement ?? true,
          fraudDetection: initialData.configuration?.fraudDetection ?? true,
          recurringPayments: initialData.configuration?.recurringPayments ?? false,
          subscriptionSupport: initialData.configuration?.subscriptionSupport ?? false,
          maxTransactionAmount: initialData.configuration?.maxTransactionAmount ?? 10000,
          minTransactionAmount: initialData.configuration?.minTransactionAmount ?? 0.5,
          dailyTransactionLimit: initialData.configuration?.dailyTransactionLimit ?? 50000,
          monthlyTransactionLimit: initialData.configuration?.monthlyTransactionLimit ?? 1000000,
          webhookRetries: initialData.configuration?.webhookRetries ?? 3,
          timeoutDuration: initialData.configuration?.timeoutDuration ?? 30,
        },
        transactionFees: initialData.transactionFees || [],
      });
      setFees(initialData.transactionFees || []);
    }
  }, [initialData]);

  const addFee = () => {
    const newFee: Partial<TransactionFee> = {
      type: "mixed",
      name: "Standard Fee",
      description: "",
      percentage: 2.9,
      amount: 0.3,
      appliesTo: ["credit_card", "debit_card"],
    };
    setFees([...fees, newFee]);
  };

  const removeFee = (index: number) => {
    setFees(fees.filter((_, i) => i !== index));
  };

  const updateFee = (index: number, field: string, value: any) => {
    const updatedFees = [...fees];
    updatedFees[index] = { ...updatedFees[index], [field]: value };
    setFees(updatedFees);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...formData, transactionFees: fees });
  };

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateConfiguration = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      configuration: { ...prev.configuration, [field]: value },
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 shrink-0" />
            {isEditing ? "Edit Gateway" : "Add New Gateway"}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? "Update payment gateway configuration" : "Configure a new payment gateway"}
          </DialogDescription>
        </DialogHeader>

        <Separator />

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="credentials">Credentials</TabsTrigger>
              <TabsTrigger value="configuration">Configuration</TabsTrigger>
              <TabsTrigger value="fees">Fees</TabsTrigger>
            </TabsList>

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
                  <p className="text-xs text-muted-foreground">
                    User-friendly name shown in interface
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="provider">Provider</Label>
                <Select
                  value={formData.provider}
                  onValueChange={(value) => updateFormData("provider", value)}
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
                    onValueChange={(value) => updateFormData("environment", value)}
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
                    <p className="text-xs text-muted-foreground">
                      Set as the default payment gateway
                    </p>
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
                  <p className="text-xs text-muted-foreground">
                    Merchant identifier (if applicable)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accountId">Account ID</Label>
                  <Input
                    id="accountId"
                    placeholder="Enter account ID..."
                    value={formData.accountId}
                    onChange={(e) => updateFormData("accountId", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Account identifier (if applicable)
                  </p>
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
                <p className="text-xs text-muted-foreground">
                  URL to receive webhook notifications
                </p>
              </div>
            </TabsContent>

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
                        <p className="text-xs text-muted-foreground">
                          Allow partial payment processing
                        </p>
                      </div>
                      <Switch
                        checked={formData.configuration.allowPartialPayments}
                        onCheckedChange={(checked) =>
                          updateConfiguration("allowPartialPayments", checked)
                        }
                      />
                    </div>

                    <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <Label className="text-base">Require CVV</Label>
                        <p className="text-xs text-muted-foreground">
                          Require CVV for card payments
                        </p>
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
                        <p className="text-xs text-muted-foreground">
                          Require 3D Secure authentication
                        </p>
                      </div>
                      <Switch
                        checked={formData.configuration.require3ds}
                        onCheckedChange={(checked) => updateConfiguration("require3ds", checked)}
                      />
                    </div>

                    <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <Label className="text-base">Auto Capture</Label>
                        <p className="text-xs text-muted-foreground">
                          Automatically capture payments
                        </p>
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

            <TabsContent value="fees" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Transaction Fees</h3>
                  <p className="text-sm text-muted-foreground">
                    Configure fees for different payment methods
                  </p>
                </div>
                <Button type="button" variant="outline" onClick={addFee}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Fee
                </Button>
              </div>

              <div className="space-y-4">
                {fees.map((fee, index) => (
                  <Card key={index}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium">{fee.name || "New Fee"}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFee(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Fee Name</Label>
                          <Input
                            value={fee.name || ""}
                            onChange={(e) => updateFee(index, "name", e.target.value)}
                            placeholder="e.g., Standard Card Fee"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Fee Type</Label>
                          <Select
                            value={fee.type || "fixed"}
                            onValueChange={(value) => updateFee(index, "type", value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="fixed">Fixed Amount</SelectItem>
                              <SelectItem value="percentage">Percentage</SelectItem>
                              <SelectItem value="mixed">Mixed (Fixed + %)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {(fee.type === "percentage" || fee.type === "mixed") && (
                        <div className="space-y-2">
                          <Label>Percentage (%)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={fee.percentage || ""}
                            onChange={(e) =>
                              updateFee(index, "percentage", parseFloat(e.target.value))
                            }
                            placeholder="2.9"
                          />
                        </div>
                      )}

                      {(fee.type === "fixed" || fee.type === "mixed") && (
                        <div className="space-y-2">
                          <Label>Fixed Amount ($)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={fee.amount || ""}
                            onChange={(e) => updateFee(index, "amount", parseFloat(e.target.value))}
                            placeholder="0.30"
                          />
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label>Applies To</Label>
                        <div className="space-y-2">
                          {PAYMENT_METHOD_OPTIONS.map((option) => {
                            const Icon = option.icon;
                            return (
                              <div key={option.value} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`fee-${index}-${option.value}`}
                                  checked={fee.appliesTo?.includes(option.value) || false}
                                  onCheckedChange={(checked) => {
                                    const currentAppliesTo = fee.appliesTo || [];
                                    const newAppliesTo = checked
                                      ? [...currentAppliesTo, option.value]
                                      : currentAppliesTo.filter((m) => m !== option.value);
                                    updateFee(index, "appliesTo", newAppliesTo);
                                  }}
                                />
                                <Label
                                  htmlFor={`fee-${index}-${option.value}`}
                                  className="text-sm font-normal cursor-pointer flex items-center"
                                >
                                  <Icon className="mr-2 h-4 w-4" />
                                  {option.label}
                                </Label>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {fees.length === 0 && (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center py-8">
                        <CreditCard className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">No Fees Configured</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Add transaction fees to configure payment processing costs
                        </p>
                        <Button type="button" variant="outline" onClick={addFee}>
                          <Plus className="mr-2 h-4 w-4" />
                          Add Your First Fee
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end space-x-2 pt-6 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{isEditing ? "Update Gateway" : "Create Gateway"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
