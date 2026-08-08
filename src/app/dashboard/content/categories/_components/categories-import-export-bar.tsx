import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface CategoriesImportExportBarProps {
  onExport: (format: "csv" | "json") => void;
}

export function CategoriesImportExportBar({ onExport }: CategoriesImportExportBarProps) {
  return (
    <div className="flex items-center gap-2 p-3 bg-muted/20 rounded-lg border">
      <span className="text-sm font-medium">Import/Export:</span>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => onExport("csv")}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
        <Button variant="outline" size="sm" onClick={() => onExport("json")}>
          <Download className="mr-2 h-4 w-4" />
          Export JSON
        </Button>
      </div>
    </div>
  );
}
