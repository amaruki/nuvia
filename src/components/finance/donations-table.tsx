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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Donation, DonationPayment } from "@/types/finance.types";
import {
  MoreHorizontal,
  Eye,
  CreditCard,
  Mail,
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  HandHeart,
} from "lucide-react";

interface DonationsTableProps {
  donations: Donation[];
  payments: DonationPayment[];
  onViewDetails?: (donation: Donation) => void;
  onRecordPayment?: (donationId: string, amount: number, paymentMethod: string) => void;
  onSendReceipt?: (donationId: string) => void;
  onUpdateStatus?: (donationId: string, status: Donation['status']) => void;
}

export function DonationsTable({
  donations,
  payments,
  onViewDetails,
  onRecordPayment,
  onSendReceipt,
  onUpdateStatus,
}: DonationsTableProps) {
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusIcon = (status: Donation['status']) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "refunded":
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      case "pledged":
        return <HandHeart className="h-4 w-4 text-blue-600" />;
      default:
        return null;
    }
  };

  const getStatusVariant = (status: Donation['status']) => {
    switch (status) {
      case "completed":
        return "default";
      case "pending":
        return "secondary";
      case "failed":
        return "destructive";
      case "refunded":
        return "outline";
      case "pledged":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getDonorTypeIcon = (donorType: Donation['donorType']) => {
    switch (donorType) {
      case "individual":
        return <span className="text-xs">👤</span>;
      case "organization":
        return <span className="text-xs">🏢</span>;
      case "anonymous":
        return <span className="text-xs">🎭</span>;
      default:
        return null;
    }
  };

  const getDonationTypeIcon = (donationType: Donation['donationType']) => {
    switch (donationType) {
      case "one_time":
        return <span className="text-xs">💵</span>;
      case "recurring":
        return <span className="text-xs">🔄</span>;
      case "pledge":
        return <span className="text-xs">🤝</span>;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Donations</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Donor</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Campaign</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Receipt</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {donations.map((donation) => (
                <TableRow key={donation.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getDonorTypeIcon(donation.donorType)}
                      <div>
                        <div className="font-medium">{donation.donorName}</div>
                        <div className="text-sm text-muted-foreground truncate max-w-[150px]">
                          {donation.donorEmail}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      {getDonationTypeIcon(donation.donationType)}
                      <span className="text-sm capitalize">{donation.donationType.replace('_', ' ')}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{donation.campaign || "General"}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{formatCurrency(donation.amount)}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {new Date(donation.donationDate).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(donation.status)}
                      <Badge variant={getStatusVariant(donation.status)} className="text-xs">
                        {donation.status}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {donation.receiptSent ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Clock className="h-4 w-4 text-yellow-600" />
                      )}
                      <span className="text-sm">
                        {donation.receiptSent ? "Sent" : "Pending"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => onViewDetails?.(donation)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {donation.status !== "completed" && (
                          <DropdownMenuItem
                            onClick={() => onRecordPayment?.(donation.id, donation.amount, "Credit Card")}
                          >
                            <CreditCard className="mr-2 h-4 w-4" />
                            Record Payment
                          </DropdownMenuItem>
                        )}
                        {!donation.receiptSent && (
                          <DropdownMenuItem
                            onClick={() => onSendReceipt?.(donation.id)}
                          >
                            <Mail className="mr-2 h-4 w-4" />
                            Send Receipt
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem>
                          <Download className="mr-2 h-4 w-4" />
                          Download Receipt
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                        {donation.status !== "completed" && (
                          <DropdownMenuItem
                            onClick={() => onUpdateStatus?.(donation.id, "completed")}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Mark as Completed
                          </DropdownMenuItem>
                        )}
                        {donation.status !== "pending" && (
                          <DropdownMenuItem
                            onClick={() => onUpdateStatus?.(donation.id, "pending")}
                          >
                            <Clock className="mr-2 h-4 w-4" />
                            Mark as Pending
                          </DropdownMenuItem>
                        )}
                        {donation.status !== "failed" && (
                          <DropdownMenuItem
                            onClick={() => onUpdateStatus?.(donation.id, "failed")}
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Mark as Failed
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}