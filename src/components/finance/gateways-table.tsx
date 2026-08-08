"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import {
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  TestTube,
  Power,
  PowerOff,
  Star,
  StarOff,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { PaymentGateway } from "@/types/finance";
import { formatDistanceToNow } from "date-fns";

interface GatewaysTableProps {
  gateways: PaymentGateway[];
  onViewDetails: (gateway: PaymentGateway) => void;
  onEdit: (gateway: PaymentGateway) => void;
  onDelete: (gateway: PaymentGateway) => void;
  onToggleStatus: (gateway: PaymentGateway, enabled: boolean) => void;
  onTest: (gateway: PaymentGateway) => void;
  onSetDefault: (gateway: PaymentGateway) => void;
}

export function GatewaysTable({
  gateways,
  onViewDetails,
  onEdit,
  onDelete,
  onToggleStatus,
  onTest,
  onSetDefault,
}: GatewaysTableProps) {
  const [testingGateway, setTestingGateway] = useState<string | null>(null);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "inactive":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "testing":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "error":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "default" as const,
      inactive: "secondary" as const,
      testing: "outline" as const,
      error: "destructive" as const,
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getEnvironmentBadge = (environment: string) => {
    return (
      <Badge variant={environment === "production" ? "default" : "outline"}>
        {environment === "production" ? "Prod" : "Sandbox"}
      </Badge>
    );
  };

  const handleTest = async (gateway: PaymentGateway) => {
    setTestingGateway(gateway.id);
    try {
      await onTest(gateway);
    } finally {
      setTestingGateway(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Gateway</TableHead>
            <TableHead>Provider</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Environment</TableHead>
            <TableHead>Transactions</TableHead>
            <TableHead>Volume</TableHead>
            <TableHead>Success Rate</TableHead>
            <TableHead>Enabled</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {gateways.map((gateway) => (
            <TableRow key={gateway.id} className="hover:bg-muted/50">
              <TableCell>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                    {getStatusIcon(gateway.status)}
                  </div>
                  <div>
                    <div className="font-medium">{gateway.displayName}</div>
                    <div className="text-sm text-muted-foreground">
                      {gateway.currencies.join(", ")}
                    </div>
                  </div>
                  {gateway.isDefault && <Star className="h-4 w-4 text-yellow-500" />}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="capitalize">
                  {gateway.provider}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(gateway.status)}
                  {gateway.lastTestedAt && (
                    <span className="text-xs text-muted-foreground">
                      Tested {formatDistanceToNow(gateway.lastTestedAt, { addSuffix: true })}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>{getEnvironmentBadge(gateway.environment)}</TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">
                    {gateway.statistics.totalTransactions.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {gateway.statistics.monthlyTransactions[0]?.count || 0} this month
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">
                    {formatCurrency(gateway.statistics.totalVolume)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatCurrency(gateway.statistics.monthlyTransactions[0]?.volume || 0)} this
                    month
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <span
                    className={`font-medium ${
                      gateway.statistics.successRate >= 95
                        ? "text-green-600"
                        : gateway.statistics.successRate >= 90
                          ? "text-yellow-600"
                          : "text-red-600"
                    }`}
                  >
                    {gateway.statistics.successRate.toFixed(1)}%
                  </span>
                  {gateway.statistics.errorRates.length > 0 && (
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Switch
                  checked={gateway.isEnabled}
                  onCheckedChange={(checked) => onToggleStatus(gateway, checked)}
                  disabled={gateway.status === "testing"}
                />
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onViewDetails(gateway)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(gateway)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleTest(gateway)}
                      disabled={testingGateway === gateway.id}
                    >
                      <TestTube className="mr-2 h-4 w-4" />
                      {testingGateway === gateway.id ? "Testing..." : "Test Connection"}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {!gateway.isDefault && (
                      <DropdownMenuItem onClick={() => onSetDefault(gateway)}>
                        <Star className="mr-2 h-4 w-4" />
                        Set as Default
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => onToggleStatus(gateway, !gateway.isEnabled)}>
                      {gateway.isEnabled ? (
                        <>
                          <PowerOff className="mr-2 h-4 w-4" />
                          Disable
                        </>
                      ) : (
                        <>
                          <Power className="mr-2 h-4 w-4" />
                          Enable
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete(gateway)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
