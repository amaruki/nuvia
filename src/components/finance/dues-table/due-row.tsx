"use client";

import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import type { MemberDue } from "@/types/finance";
import { formatCurrency, isOverdue } from "./helpers";
import { DueStatusBadge } from "./due-badges";
import { DueActionsMenu } from "./due-actions-menu";

export interface DueRowProps {
  due: MemberDue;
  onViewDetails: (due: MemberDue) => void;
  onRecordPayment: (due: MemberDue) => void;
  onSendReminder: (dueId: string, type: "email" | "sms" | "in_app") => void;
  onUpdateStatus: (dueId: string, status: MemberDue["status"]) => void;
}

export function DueRow({
  due,
  onViewDetails,
  onRecordPayment,
  onSendReminder,
  onUpdateStatus,
}: DueRowProps) {
  return (
    <TableRow>
      <TableCell>
        <div>
          <div className="font-medium">{due.memberName}</div>
          <div className="text-sm text-muted-foreground">{due.memberEmail}</div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline">{due.membershipTier}</Badge>
      </TableCell>
      <TableCell>{formatCurrency(due.dueAmount)}</TableCell>
      <TableCell>{formatCurrency(due.paidAmount)}</TableCell>
      <TableCell className={due.balanceAmount > 0 ? "font-medium" : ""}>
        {formatCurrency(due.balanceAmount)}
      </TableCell>
      <TableCell>
        <div className={isOverdue(due.dueDate, due.status) ? "text-red-600" : ""}>
          {new Date(due.dueDate).toLocaleDateString()}
          {isOverdue(due.dueDate, due.status) && <div className="text-xs">Overdue</div>}
        </div>
      </TableCell>
      <TableCell>
        <DueStatusBadge status={due.status} />
      </TableCell>
      <TableCell className="text-right">
        <DueActionsMenu
          due={due}
          onViewDetails={onViewDetails}
          onRecordPayment={onRecordPayment}
          onSendReminder={onSendReminder}
          onUpdateStatus={onUpdateStatus}
        />
      </TableCell>
    </TableRow>
  );
}
