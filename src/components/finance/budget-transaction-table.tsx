"use client";

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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Edit, Trash2, Receipt } from "lucide-react";
import { BudgetTransaction } from "@/types/finance";

interface BudgetTransactionTableProps {
  transactions: BudgetTransaction[];
  onView?: (transaction: BudgetTransaction) => void;
  onEdit?: (transaction: BudgetTransaction) => void;
  onDelete?: (transaction: BudgetTransaction) => void;
}

export function BudgetTransactionTable({
  transactions,
  onView,
  onEdit,
  onDelete,
}: BudgetTransactionTableProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "income":
        return "text-green-600";
      case "refund":
        return "text-blue-600";
      default:
        return "text-red-600";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return { variant: "default" as const, text: "Approved" };
      case "pending":
        return { variant: "secondary" as const, text: "Pending" };
      case "rejected":
        return { variant: "destructive" as const, text: "Rejected" };
      default:
        return { variant: "outline" as const, text: status };
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Vendor</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => {
            const statusBadge = getStatusBadge(transaction.status);

            return (
              <TableRow key={transaction.id}>
                <TableCell className="font-medium">{formatDate(transaction.date)}</TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{transaction.description}</p>
                    {transaction.notes && (
                      <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                        {transaction.notes}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {transaction.categoryId}
                    </Badge>
                    {transaction.subcategoryId && (
                      <Badge variant="secondary" className="text-xs">
                        {transaction.subcategoryId}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className={`font-medium ${getTypeColor(transaction.type)}`}>
                  {transaction.type === "income" || transaction.type === "refund" ? "+" : "-"}
                  {formatCurrency(transaction.amount)}
                </TableCell>
                <TableCell>
                  <Badge variant={statusBadge.variant}>{statusBadge.text}</Badge>
                </TableCell>
                <TableCell>
                  {transaction.vendor || <span className="text-muted-foreground">N/A</span>}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {onView && (
                        <DropdownMenuItem onClick={() => onView(transaction)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                      )}
                      {transaction.receiptUrl && (
                        <DropdownMenuItem>
                          <Receipt className="mr-2 h-4 w-4" />
                          View Receipt
                        </DropdownMenuItem>
                      )}
                      {onEdit && (
                        <DropdownMenuItem onClick={() => onEdit(transaction)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                      )}
                      {onDelete && (
                        <DropdownMenuItem
                          onClick={() => onDelete(transaction)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
