import { UserTable } from "../user-table";
import type { UserDirectoryListViewProps } from "./types";

export default function UserDirectoryListView({
  users,
  selectedUsers,
  onSelectUser,
  onSelectAll,
  sort,
  onSort,
  showSelection,
}: UserDirectoryListViewProps) {
  return (
    <div className="space-y-0">
      <UserTable
        users={users}
        selectedUsers={selectedUsers}
        onSelectUser={onSelectUser}
        onSelectAll={onSelectAll}
        sort={sort}
        onSort={onSort}
        showSelection={showSelection}
      />
    </div>
  );
}
