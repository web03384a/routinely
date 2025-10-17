import { HabitFrequency, HabitTask, Weekday } from "../types";
import { addDays, getWeekday, isSameDay, normalizeDateKey } from "./date";

const MAX_LOOKBACK_DAYS = 365;

const ensureAnchorDate = (frequency: HabitFrequency, fallback: string): HabitFrequency => {
  if (frequency.kind === "interval") {
    return {
      ...frequency,
      anchorDate: normalizeDateKey(frequency.anchorDate ?? fallback)
    };
  }
  return frequency;
};

export const normalizeHabitFrequency = (frequency: HabitFrequency, fallback: string): HabitFrequency => {
  if (frequency.kind === "weekly") {
    const sanitized = Array.from(new Set(frequency.daysOfWeek)).filter((day) => day >= 0 && day <= 6);
    if (sanitized.length === 0) {
      return { kind: "weekly", daysOfWeek: [getWeekday(fallback)] };
    }
    sanitized.sort((a, b) => a - b);
    return { kind: "weekly", daysOfWeek: sanitized as Weekday[] };
  }
  if (frequency.kind === "interval") {
    const intervalDays = Math.max(1, Math.floor(frequency.intervalDays));
    return ensureAnchorDate({ kind: "interval", intervalDays, anchorDate: frequency.anchorDate }, fallback);
  }
  return frequency;
};

export const isHabitDueOnDate = (task: HabitTask, dateKey: string): boolean => {
  const normalizedDate = normalizeDateKey(dateKey);
  if (task.frequency.kind === "daily") {
    return true;
  }

  if (task.frequency.kind === "weekly") {
    const today = getWeekday(normalizedDate);
    return task.frequency.daysOfWeek.includes(today);
  }

  const anchor = normalizeDateKey(task.frequency.anchorDate);
  if (normalizedDate < anchor) {
    return false;
  }

  const span = Math.floor(
    (new Date(normalizedDate).getTime() - new Date(anchor).getTime()) / (1000 * 60 * 60 * 24)
  );
  return span % Math.max(1, task.frequency.intervalDays) === 0;
};

export const countDueOccurrencesBetween = (
  task: HabitTask,
  from: string | null,
  toExclusive: string
): number => {
  if (!toExclusive) return 0;
  const end = normalizeDateKey(toExclusive);
  const start = normalizeDateKey(from ?? task.createdOn);
  let cursor = addDays(start, 1);
  let missed = 0;

  while (cursor < end) {
    if (isHabitDueOnDate(task, cursor)) {
      missed += 1;
    }
    cursor = addDays(cursor, 1);
    if (missed > MAX_LOOKBACK_DAYS) {
      break;
    }
  }

  return missed;
};

export const getPreviousDueDate = (task: HabitTask, reference: string): string | null => {
  let steps = 1;
  let cursor = addDays(reference, -1);
  while (steps <= MAX_LOOKBACK_DAYS) {
    if (isHabitDueOnDate(task, cursor)) {
      return cursor;
    }
    cursor = addDays(cursor, -1);
    steps += 1;
  }
  return null;
};

export const isConsecutiveCompletion = (task: HabitTask, today: string): boolean => {
  if (!task.lastCompletedOn) {
    return false;
  }
  const previousDue = getPreviousDueDate(task, today);
  if (!previousDue) {
    return false;
  }
  return isSameDay(previousDue, task.lastCompletedOn);
};
