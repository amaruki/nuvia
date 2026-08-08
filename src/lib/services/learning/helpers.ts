import type { Module } from "@/types/learning.types";

/** Sums lesson durations ("45 min", "1h 15m", "2h") into a display label. */
export function computeDuration(modules: Module[] | undefined): string {
  let minutes = 0;
  for (const module of modules ?? []) {
    for (const lesson of module.lessons) {
      minutes += parseLessonMinutes(lesson.duration);
    }
  }
  if (minutes <= 0) return "";
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest}m`;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}

// Module-scope so the patterns compile once, not per lesson in the nested
// loop; sharing is safe because without /g, .exec keeps no lastIndex state.
const LESSON_HOURS_RE = /(\d+(?:\.\d+)?)\s*h/i;
const LESSON_MINUTES_RE = /(\d+)\s*m(?:in)?/i;

function parseLessonMinutes(duration: string): number {
  let total = 0;
  const hours = LESSON_HOURS_RE.exec(duration)?.[1];
  if (hours) total += Number.parseFloat(hours) * 60;
  const mins = LESSON_MINUTES_RE.exec(duration)?.[1];
  if (mins) total += Number.parseInt(mins, 10);
  return Math.round(total);
}
