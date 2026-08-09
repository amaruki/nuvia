"use client";

import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";

import { DataTable, DataTableColumnHeader, DataTableSearch } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";

export interface RealUserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
}

const columns: ColumnDef<RealUserRow>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
  },
  {
    accessorKey: "email",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
    cell: ({ row }) => <span className="text-muted-foreground">{row.original.email}</span>,
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => (
      <Badge variant={row.original.role === "admin" ? "secondary" : "outline"}>
        {row.original.role}
      </Badge>
    ),
    filterFn: (row, _id, value: string) =>
      row.original.role.toLowerCase().includes(value.toLowerCase()),
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Joined" />,
    cell: ({ row }) => (
      <span className="text-muted-foreground tabular-nums">
        {row.original.createdAt.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </span>
    ),
    sortingFn: (a, b) => a.original.createdAt.getTime() - b.original.createdAt.getTime(),
  },
];

export function RealUsersTable({ users }: { users: RealUserRow[] }) {
  const [filter, setFilter] = useState("");

  return (
    <DataTable
      columns={columns}
      data={users}
      caption="Real user rows read from the local database"
      globalFilter={filter}
      onGlobalFilterChange={setFilter}
      getRowId={(row) => row.id}
      toolbar={
        <DataTableSearch
          value={filter}
          onValueChange={setFilter}
          placeholder="Search real users..."
          id="real-users-search"
        />
      }
    />
  );
}
