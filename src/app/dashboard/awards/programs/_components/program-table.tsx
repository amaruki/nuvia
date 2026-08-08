"use client";

import { format } from "date-fns";
import { Trophy, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AwardProgram } from "@/types/award.types";
import {
  CATEGORY_BADGE_CLASSES,
  STATUS_BADGE_VARIANTS,
  formatDateRange,
  formatEnumLabel,
} from "./program-utils";

interface ProgramTableProps {
  programs: AwardProgram[];
  hasActiveFilters: boolean;
  clearFilters: () => void;
}

export function ProgramTable({ programs, hasActiveFilters, clearFilters }: ProgramTableProps) {
  return (
    <Card>
      <CardContent className="p-0">
        {programs.length === 0 ? (
          <EmptyState
            icon={<Trophy className="h-10 w-10 text-muted-foreground" />}
            title={hasActiveFilters ? "No programs match your filters" : "No award programs yet"}
            description={
              hasActiveFilters
                ? "Try adjusting the status, category, or search terms."
                : "Award programs created through the awards API will appear here."
            }
            actions={
              hasActiveFilters ? (
                <Button variant="outline" onClick={clearFilters}>
                  <X className="h-4 w-4" />
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Program</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Nominations</TableHead>
                <TableHead>Nomination Window</TableHead>
                <TableHead>Award Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {programs.map((program) => (
                <TableRow key={program.id}>
                  <TableCell className="max-w-xs">
                    <div className="font-medium">{program.name}</div>
                    {program.description && (
                      <div className="truncate text-sm text-muted-foreground">
                        {program.description}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={CATEGORY_BADGE_CLASSES[program.category]}>
                      {formatEnumLabel(program.category)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_BADGE_VARIANTS[program.status]}>
                      {formatEnumLabel(program.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{program.nominationCount}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDateRange(program)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {program.awardDate ? format(program.awardDate, "MMM d, yyyy") : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
