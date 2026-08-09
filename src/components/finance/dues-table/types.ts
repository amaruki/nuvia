import type { DuePayment, MemberDue } from "@/types/finance";

export interface DuesTableProps {
  dues: MemberDue[];
  payments: DuePayment[];
  onRecordPayment: (dueId: string, amount: number, paymentMethod: string) => void;
  onSendReminder: (dueId: string, type: "email" | "sms" | "in_app") => void;
  onUpdateStatus: (dueId: string, status: MemberDue["status"]) => void;
}
