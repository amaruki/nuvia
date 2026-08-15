"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AlertCircle, Clock, CreditCard, Eye, Mail, MoreHorizontal } from "lucide-react";
import type { MemberDue } from "@/types/finance";

export interface DueActionsMenuProps {
  due: MemberDue;
  onViewDetails: (due: MemberDue) => void;
  onRecordPayment: (due: MemberDue) => void;
  onSendReminder: (dueId: string, type: "email" | "sms" | "in_app") => void;
  onUpdateStatus: (dueId: string, status: MemberDue["status"]) => void;
}

export function DueActionsMenu({
  due,
  onViewDetails,
  onRecordPayment,
  onSendReminder,
  onUpdateStatus,
}: DueActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-8 w-8 p-0"
          aria-label={`Actions for ${due.memberName}'s due`}
          onClick={(event) => event.stopPropagation()}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onViewDetails(due)}>
          <Eye className="mr-2 h-4 w-4" />
          View Details
        </DropdownMenuItem>

        {due.status !== "paid" && due.status !== "cancelled" && (
          <>
            <DropdownMenuItem onClick={() => onRecordPayment(due)}>
              <CreditCard className="mr-2 h-4 w-4" />
              Record Payment
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={() => onSendReminder(due.id, "email")}>
              <Mail className="mr-2 h-4 w-4" />
              Send Email Reminder
            </DropdownMenuItem>
          </>
        )}

        {/* TODO: Implement status change actions in future */}
        {due.status === "pending" && (
          <DropdownMenuItem onClick={() => onUpdateStatus(due.id, "overdue")}>
            <AlertCircle className="mr-2 h-4 w-4" />
            Mark as Overdue
          </DropdownMenuItem>
        )}

        {due.status === "overdue" && (
          <DropdownMenuItem onClick={() => onUpdateStatus(due.id, "pending")}>
            <Clock className="mr-2 h-4 w-4" />
            Mark as Pending
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
