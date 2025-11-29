"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  MoreHorizontal, 
  Mail, 
  CreditCard, 
  Eye, 
  CheckCircle,
  AlertCircle,
  Clock,
  XCircle,
  Send,
  FileText,
  Download
} from "lucide-react";
import { Invoice, InvoicePayment } from "@/types/finance.types";
import { InvoiceDetailsModal } from "./invoice-details-modal";

interface InvoicesTableProps {
  invoices: Invoice[];
  payments: InvoicePayment[];
  onRecordPayment: (invoiceId: string, amount: number, paymentMethod: string) => void;
  onSendReminder: (invoiceId: string, type: 'email' | 'sms' | 'in_app') => void;
  onUpdateStatus: (invoiceId: string, status: Invoice['status']) => void;
  onSendInvoice: (invoiceId: string) => void;
}

export function InvoicesTable({ 
  invoices, 
  payments, 
  onRecordPayment, 
  onSendReminder, 
  onUpdateStatus,
  onSendInvoice 
}: InvoicesTableProps) {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: Invoice['status']) => {
    switch (status) {
      case 'paid':
        return { variant: 'default' as const, icon: CheckCircle, text: 'Paid' };
      case 'sent':
        return { variant: 'secondary' as const, icon: Send, text: 'Sent' };
      case 'overdue':
        return { variant: 'destructive' as const, icon: AlertCircle, text: 'Overdue' };
      case 'draft':
        return { variant: 'outline' as const, icon: FileText, text: 'Draft' };
      case 'cancelled':
        return { variant: 'outline' as const, icon: XCircle, text: 'Cancelled' };
      case 'refunded':
        return { variant: 'outline' as const, icon: CreditCard, text: 'Refunded' };
      default:
        return { variant: 'secondary' as const, icon: Clock, text: status };
    }
  };

  const handleViewDetails = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setDetailsModalOpen(true);
  };

  const handleRecordPayment = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    const balanceAmount = invoice.totalAmount - (invoice.paidAmount || 0);
    setPaymentAmount(balanceAmount.toString());
    setPaymentDialogOpen(true);
  };

  const handlePaymentSubmit = () => {
    if (selectedInvoice && paymentAmount && paymentMethod) {
      onRecordPayment(selectedInvoice.id, parseFloat(paymentAmount), paymentMethod);
      setPaymentDialogOpen(false);
      setSelectedInvoice(null);
      setPaymentAmount("");
      setPaymentMethod("");
    }
  };

  const isOverdue = (dueDate: Date, status: Invoice['status']) => {
    return status === 'sent' && new Date(dueDate) < new Date();
  };

  const getBalanceAmount = (invoice: Invoice) => {
    return invoice.totalAmount - (invoice.paidAmount || 0);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
          <CardDescription>
            Manage client invoices and billing
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => {
                  const statusBadge = getStatusBadge(invoice.status);
                  const StatusIcon = statusBadge.icon;
                  const balanceAmount = getBalanceAmount(invoice);
                  
                  return (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{invoice.clientName}</div>
                          <div className="text-sm text-muted-foreground">{invoice.clientEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(invoice.totalAmount)}</TableCell>
                      <TableCell>{formatCurrency(invoice.paidAmount || 0)}</TableCell>
                      <TableCell className={balanceAmount > 0 ? "font-medium text-red-600" : ""}>
                        {formatCurrency(balanceAmount)}
                      </TableCell>
                      <TableCell>
                        <div className={isOverdue(invoice.dueDate, invoice.status) ? "text-red-600" : ""}>
                          {new Date(invoice.dueDate).toLocaleDateString()}
                          {isOverdue(invoice.dueDate, invoice.status) && (
                            <div className="text-xs">Overdue</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusBadge.variant} className="flex items-center gap-1 w-fit">
                          <StatusIcon className="h-3 w-3" />
                          {statusBadge.text}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetails(invoice)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            
                            {invoice.status === 'draft' && (
                              <DropdownMenuItem onClick={() => onSendInvoice(invoice.id)}>
                                <Send className="mr-2 h-4 w-4" />
                                Send Invoice
                              </DropdownMenuItem>
                            )}
                            
                            {invoice.status !== 'paid' && invoice.status !== 'cancelled' && invoice.status !== 'refunded' && (
                              <>
                                <DropdownMenuItem onClick={() => handleRecordPayment(invoice)}>
                                  <CreditCard className="mr-2 h-4 w-4" />
                                  Record Payment
                                </DropdownMenuItem>
                                
                                <DropdownMenuSeparator />
                                
                                <DropdownMenuItem onClick={() => onSendReminder(invoice.id, 'email')}>
                                  <Mail className="mr-2 h-4 w-4" />
                                  Send Reminder
                                </DropdownMenuItem>
                              </>
                            )}
                            
                            <DropdownMenuSeparator />
                            
                            <DropdownMenuItem>
                              <Download className="mr-2 h-4 w-4" />
                              Download PDF
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {invoices.map((invoice) => {
              const statusBadge = getStatusBadge(invoice.status);
              const StatusIcon = statusBadge.icon;
              const balanceAmount = getBalanceAmount(invoice);
              
              return (
                <Card key={invoice.id} className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{invoice.invoiceNumber}</p>
                      <p className="text-sm text-muted-foreground truncate">{invoice.clientName}</p>
                    </div>
                    <Badge variant={statusBadge.variant} className="flex items-center gap-1 ml-2 shrink-0">
                      <StatusIcon className="h-3 w-3" />
                      {statusBadge.text}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Amount:</span>
                      <span className="font-medium">{formatCurrency(invoice.totalAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Paid:</span>
                      <span>{formatCurrency(invoice.paidAmount || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Balance:</span>
                      <span className={`font-medium ${balanceAmount > 0 ? "text-red-600" : ""}`}>
                        {formatCurrency(balanceAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Due:</span>
                      <span className={isOverdue(invoice.dueDate, invoice.status) ? "text-red-600" : ""}>
                        {new Date(invoice.dueDate).toLocaleDateString()}
                        {isOverdue(invoice.dueDate, invoice.status) && (
                          <span className="block text-xs">Overdue</span>
                        )}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleViewDetails(invoice)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    
                    {invoice.status === 'draft' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => onSendInvoice(invoice.id)}
                      >
                        <Send className="h-4 w-4 mr-1" />
                        Send
                      </Button>
                    )}
                    
                    {invoice.status !== 'paid' && invoice.status !== 'cancelled' && invoice.status !== 'refunded' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleRecordPayment(invoice)}
                      >
                        <CreditCard className="h-4 w-4 mr-1" />
                        Pay
                      </Button>
                    )}
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="px-2">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {invoice.status !== 'draft' && (
                          <DropdownMenuItem onClick={() => handleViewDetails(invoice)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                        )}
                        
                        {invoice.status === 'draft' && (
                          <DropdownMenuItem onClick={() => onSendInvoice(invoice.id)}>
                            <Send className="mr-2 h-4 w-4" />
                            Send Invoice
                          </DropdownMenuItem>
                        )}
                        
                        {invoice.status !== 'paid' && invoice.status !== 'cancelled' && invoice.status !== 'refunded' && (
                          <>
                            <DropdownMenuItem onClick={() => handleRecordPayment(invoice)}>
                              <CreditCard className="mr-2 h-4 w-4" />
                              Record Payment
                            </DropdownMenuItem>
                            
                            <DropdownMenuSeparator />
                            
                            <DropdownMenuItem onClick={() => onSendReminder(invoice.id, 'email')}>
                              <Mail className="mr-2 h-4 w-4" />
                              Send Reminder
                            </DropdownMenuItem>
                          </>
                        )}
                        
                        <DropdownMenuSeparator />
                        
                        <DropdownMenuItem>
                          <Download className="mr-2 h-4 w-4" />
                          Download PDF
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Record a payment for {selectedInvoice?.clientName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Payment Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
                {selectedInvoice && (
                  <p className="text-sm text-muted-foreground">
                    Outstanding: {formatCurrency(getBalanceAmount(selectedInvoice))}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Credit Card">Credit Card</SelectItem>
                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                    <SelectItem value="PayPal">PayPal</SelectItem>
                    <SelectItem value="Check">Check</SelectItem>
                    <SelectItem value="Cash">Cash</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePaymentSubmit} disabled={!paymentAmount || !paymentMethod}>
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invoice Details Modal */}
      <InvoiceDetailsModal
        invoice={selectedInvoice}
        payments={payments}
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        onRecordPayment={onRecordPayment}
        onSendReminder={onSendReminder}
      />
    </>
  );
}