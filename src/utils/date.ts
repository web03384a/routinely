import type { Weekday } from "../types";

const MS_IN_DAY = 1000 * 60 * 60 * 24;

export const normalizeDateKey = (input: string | Date): string => {
  const base = typeof input === "string" ? new Date(input) : new Date(input.getTime());
  base.setHours(0, 0, 0, 0);
  return base.toISOString();
};

export const todayKey = (): string => normalizeDateKey(new Date());

export const addDays = (dateKey: string, amount: number): string => {
  const base = new Date(dateKey);
  base.setHours(0, 0, 0, 0);
  base.setDate(base.getDate() + amount);
  return base.toISOString();
};

export const isSameDay = (a: string | null, b: string | null): boolean => {
  if (!a || !b) return false;
  const dateA = new Date(a);
  const dateB = new Date(b);
  return dateA.toDateString() === dateB.toDateString();
};

export const getWeekday = (dateKey: string): Weekday => {
  const date = new Date(dateKey);
  return date.getDay() as Weekday;
};

export const isYesterday = (date: string | null): boolean => {
  if (!date) return false;
  const target = new Date(date);
  const now = new Date();
  target.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  const diff = now.getTime() - target.getTime();
  return diff > 0 && diff <= MS_IN_DAY;
};

export const daysBetween = (from: string | null, to: string | null): number => {
  if (!from || !to) return 0;
  const start = new Date(from);
  const end = new Date(to);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  const diff = end.getTime() - start.getTime();
  if (diff <= 0) return 0;
  return Math.floor(diff / MS_IN_DAY);
};
