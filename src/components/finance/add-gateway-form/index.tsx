"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GatewayConfiguration, GatewayFormData, TransactionFee } from "@/types/finance";
import { Plus } from "lucide-react";
import { AddGatewayFormProps } from "./types";
import { BasicTab } from "./basic-tab";
import { CredentialsTab } from "./credentials-tab";
import { ConfigurationTab } from "./configuration-tab";
import { FeesTab } from "./fees-tab";

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

  const updateFee = <K extends keyof TransactionFee>(
    index: number,
    field: K,
    value: TransactionFee[K],
  ) => {
    const updatedFees = [...fees];
    updatedFees[index] = { ...updatedFees[index], [field]: value };
    setFees(updatedFees);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...formData, transactionFees: fees });
  };

  const updateFormData = <K extends keyof GatewayFormData>(field: K, value: GatewayFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateConfiguration = <K extends keyof GatewayConfiguration>(
    field: K,
    value: GatewayConfiguration[K],
  ) => {
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

            <BasicTab formData={formData} updateFormData={updateFormData} />
            <CredentialsTab formData={formData} updateFormData={updateFormData} />
            <ConfigurationTab formData={formData} updateConfiguration={updateConfiguration} />
            <FeesTab fees={fees} addFee={addFee} removeFee={removeFee} updateFee={updateFee} />
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
