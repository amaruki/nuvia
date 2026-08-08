"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CreditCard } from "lucide-react";
import type { GatewayDetailsModalProps } from "./types";
import OverviewTab from "./overview-tab";
import ConfigurationTab from "./configuration-tab";
import TransactionsTab from "./transactions-tab";
import TestsTab from "./tests-tab";
import ModalFooter from "./modal-footer";

export function GatewayDetailsModal({
  gateway,
  transactions,
  testResults,
  open,
  onOpenChange,
  onTest,
  onToggleStatus,
  onSetDefault,
}: GatewayDetailsModalProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [testing, setTesting] = useState(false);

  if (!gateway) return null;

  const handleTest = async () => {
    setTesting(true);
    try {
      await onTest(gateway);
    } finally {
      setTesting(false);
    }
  };

  const handleToggleStatus = async () => {
    await onToggleStatus(gateway, !gateway.isEnabled);
  };

  const handleSetDefault = async () => {
    await onSetDefault(gateway);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 shrink-0" />
            {gateway.displayName}
            {gateway.isDefault && (
              <Badge variant="outline" className="ml-2">
                Default
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Detailed information and configuration for this payment gateway
          </DialogDescription>
        </DialogHeader>

        <Separator />

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="configuration">Configuration</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="tests">Tests</TabsTrigger>
          </TabsList>

          <OverviewTab gateway={gateway} />

          <ConfigurationTab gateway={gateway} />

          <TransactionsTab gateway={gateway} transactions={transactions} />

          <TestsTab gateway={gateway} testResults={testResults} />
        </Tabs>

        <ModalFooter
          gateway={gateway}
          testing={testing}
          onOpenChange={onOpenChange}
          onTest={handleTest}
          onToggleStatus={handleToggleStatus}
          onSetDefault={handleSetDefault}
        />
      </DialogContent>
    </Dialog>
  );
}

export default GatewayDetailsModal;
