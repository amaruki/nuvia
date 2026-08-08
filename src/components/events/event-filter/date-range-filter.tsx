"use client";

import type { UseFormRegister } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { EventFilterForm } from "./types";

interface DateRangeFilterProps {
  register: UseFormRegister<EventFilterForm>;
}

export function DateRangeFilter({ register }: DateRangeFilterProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Label htmlFor="startDate" className="text-sm font-medium">
          Start Date
        </Label>
        <Input
          id="startDate"
          type="date"
          {...register("startDate", { valueAsDate: true })}
          className="mt-1"
          aria-describedby="startDate-description"
        />
        <span id="startDate-description" className="sr-only">
          Filter events starting from this date
        </span>
      </div>
      <div>
        <Label htmlFor="endDate" className="text-sm font-medium">
          End Date
        </Label>
        <Input
          id="endDate"
          type="date"
          {...register("endDate", { valueAsDate: true })}
          className="mt-1"
          aria-describedby="endDate-description"
        />
        <span id="endDate-description" className="sr-only">
          Filter events ending by this date
        </span>
      </div>
    </div>
  );
}
