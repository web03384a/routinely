import { useMemo } from "react";
import type { HabitCompletion, HabitTask } from "../types";
import { todayKey } from "../utils/date";

type HabitSummaryPanelProps = {
  completionLog: HabitCompletion[];
  tasks: HabitTask[];
};

type PeriodStats = {
  count: number;
  previousCount: number;
  uniqueHabits: number;
  valueEntries: number;
};

const MS_IN_DAY = 1000 * 60 * 60 * 24;

const computePeriodStats = (
  entries: HabitCompletion[],
  windowDays: number,
  todayTimestamp: number
): PeriodStats => {
  let currentCount = 0;
  let previousCount = 0;
  const habitIds = new Set<string>();
  let valueEntries = 0;

  entries.forEach((entry) => {
    const entryDate = new Date(entry.completedOn);
    entryDate.setHours(0, 0, 0, 0);
    const diff = Math.floor((todayTimestamp - entryDate.getTime()) / MS_IN_DAY);
    if (diff < 0) return;

    if (diff < windowDays) {
      currentCount += 1;
      habitIds.add(entry.taskId);
      if (typeof entry.value === "number") {
        valueEntries += 1;
      }
    } else if (diff < windowDays * 2) {
      previousCount += 1;
    }
  });

  return {
    count: currentCount,
    previousCount,
    uniqueHabits: habitIds.size,
    valueEntries
  };
};

const buildMomentumMessage = (current: number, previous: number): string => {
  if (current === 0) {
    return "Start with a single check-in today and kickstart your streak.";
  }
  if (previous === 0) {
    return "Fresh momentum! Keep stacking those wins.";
  }
  if (current > previous) {
    const gain = current - previous;
    return `You outpaced last time by ${gain}! Keep riding that wave.`;
  }
  if (current === previous) {
    return "Steady glow—consistency is your superpower.";
  }
  return "You set a higher pace before. A quick check-in will close the gap.";
};

const buildMonthlyMessage = (streakHabit: HabitTask | null, activeHabits: number): string => {
  if (!streakHabit || streakHabit.streak === 0) {
    return activeHabits === 0
      ? "Choose a habit to feature this month and let it shine."
      : "You have the habits—now let one streak steal the spotlight.";
  }
  const { title, streak } = streakHabit;
  return `${title} is leading with a ${streak}-check streak. Keep its glow alive!`;
};

export const HabitSummaryPanel = ({ completionLog, tasks }: HabitSummaryPanelProps) => {
  const today = todayKey();
  const todayTimestamp = new Date(today).getTime();

  const weeklyStats = useMemo(
    () => computePeriodStats(completionLog, 7, todayTimestamp),
    [completionLog, todayTimestamp]
  );

  const monthlyStats = useMemo(
    () => computePeriodStats(completionLog, 30, todayTimestamp),
    [completionLog, todayTimestamp]
  );

  const longestStreakHabit = useMemo(() => {
    if (tasks.length === 0) return null;
    return tasks.reduce<HabitTask | null>((best, task) => {
      if (!best || task.streak > best.streak) {
        return task;
      }
      return best;
    }, null);
  }, [tasks]);

  const engagedHabits = tasks.filter((task) => task.lastCompletedOn).length;

  return (
    <section className="habit-summary">
      <div className="habit-summary__card">
        <h3 className="habit-summary__title">Weekly Pulse</h3>
        <p className="habit-summary__metric">{weeklyStats.count} check-ins logged</p>
        <p className="habit-summary__detail">
          {weeklyStats.uniqueHabits} habit{weeklyStats.uniqueHabits === 1 ? "" : "s"} active ·
          {" "}
          {weeklyStats.valueEntries} value logs
        </p>
        <p className="habit-summary__message">
          {buildMomentumMessage(weeklyStats.count, weeklyStats.previousCount)}
        </p>
      </div>

      <div className="habit-summary__card">
        <h3 className="habit-summary__title">Monthly Glow</h3>
        <p className="habit-summary__metric">{monthlyStats.count} check-ins this month</p>
        <p className="habit-summary__detail">
          {engagedHabits} habit{engagedHabits === 1 ? "" : "s"} checked in recently
        </p>
        <p className="habit-summary__message">
          {buildMonthlyMessage(longestStreakHabit, engagedHabits)}
        </p>
      </div>
    </section>
  );
};
