"use client";

import { useState } from "react";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { CommitteeWorkspace } from "@/types/committee";
import { WorkspaceRow } from "./workspace-row";
import type { WorkspacesTableProps } from "./types";

export function WorkspacesTable({
  workspaces,
  onViewDetails,
  onEdit,
  onDelete,
  onToggleStatus,
}: WorkspacesTableProps) {
  const [togglingWorkspace, setTogglingWorkspace] = useState<string | null>(null);

  const handleToggleStatus = async (
    workspace: CommitteeWorkspace,
    status: "active" | "archived",
  ) => {
    setTogglingWorkspace(workspace.id);
    try {
      await onToggleStatus(workspace, status);
    } finally {
      setTogglingWorkspace(null);
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Workspace</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Members</TableHead>
            <TableHead>Documents</TableHead>
            <TableHead>Tasks</TableHead>
            <TableHead>Discussions</TableHead>
            <TableHead>Meetings</TableHead>
            <TableHead>Activity</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {workspaces.map((workspace) => (
            <WorkspaceRow
              key={workspace.id}
              workspace={workspace}
              isToggling={togglingWorkspace === workspace.id}
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
