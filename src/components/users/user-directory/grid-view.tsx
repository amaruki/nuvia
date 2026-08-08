import { UserCard } from "./user-card";
import type { UserDirectoryGridViewProps } from "./types";

export default function UserDirectoryGridView({
  users,
  selectedUsers,
  onSelectUser,
  showSelection,
}: UserDirectoryGridViewProps) {
  return (
    <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {users.map((user) => (
        <UserCard
          key={user.id}
          user={user}
          selected={selectedUsers.includes(user.id)}
          onSelect={(checked) => onSelectUser(user.id, checked)}
          showSelection={showSelection}
        />
      ))}
    </div>
  );
}
