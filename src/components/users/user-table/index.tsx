"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { UserTableProps } from "./types";
import UserTableHead from "./table-head";
import UserTableRow from "./user-row";

export function UserTable({
  users,
  selectedUsers,
  onSelectUser,
  onSelectAll,
  sort,
  onSort,
  showSelection = false,
  className,
}: UserTableProps) {
  const [focusedRowIndex, setFocusedRowIndex] = useState<number | null>(null);

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setFocusedRowIndex((prev) => (prev === null ? 0 : Math.min(prev + 1, users.length - 1)));
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedRowIndex((prev) => (prev === null ? 0 : Math.max(prev - 1, 0)));
        break;
      case "Enter":
        // No per-row detail surface exists today, so Enter performs the one
        // real row action available: toggling selection (mirrors Space).
        if (showSelection) {
          e.preventDefault();
          onSelectUser(users[index].id, !selectedUsers.includes(users[index].id));
        }
        break;
      case " ":
        if (showSelection) {
          e.preventDefault();
          onSelectUser(users[index].id, !selectedUsers.includes(users[index].id));
        }
        break;
    }
  };

  const allSelected = showSelection && selectedUsers.length === users.length && users.length > 0;
  const someSelected =
    showSelection && selectedUsers.length > 0 && selectedUsers.length < users.length;

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-0">
        <div className="relative overflow-x-auto">
          <Table>
            <UserTableHead
              showSelection={showSelection}
              allSelected={allSelected}
              someSelected={someSelected}
              sort={sort}
              onSort={onSort}
              onSelectAll={onSelectAll}
            />
            <TableBody>
              {users.map((user, index) => (
                <UserTableRow
                  key={user.id}
                  user={user}
                  showSelection={showSelection}
                  isSelected={selectedUsers.includes(user.id)}
                  isFocused={focusedRowIndex === index}
                  onSelectUser={onSelectUser}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  onFocus={() => setFocusedRowIndex(index)}
                  onBlur={() => setFocusedRowIndex(null)}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
