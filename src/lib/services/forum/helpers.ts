import type { AuthorDto } from "./types";

export function toAuthor(row: {
  id: string;
  name: string;
  image: string | null;
  profilePhoto: string | null;
  role: string;
}): AuthorDto {
  const avatar = row.image ?? row.profilePhoto ?? undefined;
  return {
    id: row.id,
    name: row.name,
    ...(avatar ? { avatar } : {}),
    role: row.role,
  };
}
