import type { Module } from "@/types/learning.types";

export function parseDurationMinutes(duration: string): number {
  let minutes = 0;
  const hours = /(\d+(?:\.\d+)?)\s*h/i.exec(duration)?.[1];
  if (hours) minutes += Number.parseFloat(hours) * 60;
  const mins = /(\d+)\s*m(?:in)?/i.exec(duration)?.[1];
  if (mins) minutes += Number.parseInt(mins, 10);
  return minutes;
}

export function moduleDuration(module: Module): string {
  const minutes = module.lessons.reduce(
    (sum, lesson) => sum + parseDurationMinutes(lesson.duration),
    0,
  );
  if (minutes <= 0) return "0m";
  const h = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (h === 0) return `${rest}m`;
  return rest === 0 ? `${h}h` : `${h}h ${rest}m`;
}
