"use client";

import { useState } from "react";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Committee } from "@/types/committee";
import { CommitteeRow } from "./committee-row";
import type { CommitteesTableProps } from "./types";

export function CommitteesTable({
  committees,
  onViewDetails,
  onEdit,
  onDelete,
  onToggleStatus,
}: CommitteesTableProps) {
  const [togglingCommittee, setTogglingCommittee] = useState<string | null>(null);

  const handleToggleStatus = async (committee: Committee, status: "active" | "inactive") => {
    setTogglingCommittee(committee.id);
    try {
      await onToggleStatus(committee, status);
    } finally {
      setTogglingCommittee(null);
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Committee</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Members</TableHead>
            <TableHead>Attendance</TableHead>
            <TableHead>Goals</TableHead>
            <TableHead>Deliverables</TableHead>
            <TableHead>Impact</TableHead>
            <TableHead>Leadership</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {committees.map((committee) => (
            <CommitteeRow
              key={committee.id}
              committee={committee}
              isToggling={togglingCommittee === committee.id}
              onViewDetails={onViewDetails}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleStatus={handleToggleStatus}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
