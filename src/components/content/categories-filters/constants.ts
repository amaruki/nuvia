import type { CategoryFilters } from "@/types/category.types";

export const sortByOptions: { value: NonNullable<CategoryFilters["sortBy"]>; label: string }[] = [
  { value: "order", label: "Order" },
  { value: "name", label: "Name" },
  { value: "createdAt", label: "Created Date" },
  { value: "updatedAt", label: "Updated Date" },
  { value: "contentCount", label: "Content Count" },
  { value: "lastUsed", label: "Last Used" },
];

export const sortOrderOptions: {
  value: NonNullable<CategoryFilters["sortOrder"]>;
  label: string;
}[] = [
  { value: "asc", label: "Ascending" },
  { value: "desc", label: "Descending" },
];
