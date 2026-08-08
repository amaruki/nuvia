"use client";

import { useEffect, useRef } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { MediaGridRow } from "./media-grid-row";
import type { MediaGridTableProps } from "./types";

export function MediaGridTable({
  media,
  selectedMedia,
  onSelectionChange,
  onSelectItem,
  onViewDetails,
  onEdit,
  onDelete,
  onDuplicate,
}: MediaGridTableProps) {
  const selectAllRef = useRef<HTMLButtonElement>(null);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(media.map((item) => item.id));
    } else {
      onSelectionChange([]);
    }
  };

  const isAllSelected = media.length > 0 && selectedMedia.length === media.length;
  const isIndeterminate = selectedMedia.length > 0 && selectedMedia.length < media.length;

  // Set indeterminate state on the checkbox
  useEffect(() => {
    if (selectAllRef.current) {
      (selectAllRef.current as any).indeterminate = isIndeterminate;
    }
  }, [isIndeterminate]);

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-muted">
          <tr>
            <th className="p-3 text-left">
              <Checkbox
                ref={selectAllRef}
                checked={isAllSelected}
                onCheckedChange={handleSelectAll}
                className="h-4 w-4 rounded border-primary"
              />
            </th>
            <th className="p-3 text-left">Name</th>
            <th className="p-3 text-left">Type</th>
            <th className="p-3 text-left">Size</th>
            <th className="p-3 text-left">Status</th>
            <th className="p-3 text-left">Visibility</th>
            <th className="p-3 text-left">Created</th>
            <th className="p-3 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {media.map((item) => (
            <MediaGridRow
              key={item.id}
              item={item}
              isSelected={selectedMedia.includes(item.id)}
              onSelectItem={onSelectItem}
              onViewDetails={onViewDetails}
              onEdit={onEdit}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
