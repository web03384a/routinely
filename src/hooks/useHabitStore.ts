import { useCallback, useEffect, useMemo, useState } from "react";
import type { HabitCompletion, HabitFrequency, HabitTask, HabitType } from "../types";
import { isSameDay, normalizeDateKey, todayKey } from "../utils/date";
import {
  countDueOccurrencesBetween,
  isConsecutiveCompletion,
  isHabitDueOnDate,
  normalizeHabitFrequency
} from "../utils/habits";

const STORAGE_KEY = "routinely@habit-state";
const MISSED_OCCURRENCE_PENALTY = 5;
const COMPLETION_LOG_LIMIT = 200;

type HabitState = {
  tasks: HabitTask[];
  totalPoints: number;
  completionLog: HabitCompletion[];
};

export type RewardDetails = {
  taskId: string;
  taskTitle: string;
  pointsAwarded: number;
  newStreak: number;
  missedOccurrences: number;
  penaltyApplied: number;
  valueRecorded?: number;
  valueUnit?: string;
};

export type NewHabitInput = {
  title: string;
  type: HabitType;
  frequency: HabitFrequency;
  valueUnit?: string;
  defaultTargetValue?: number;
};

export type CompleteHabitOptions = {
  value?: number;
};

const defaultState: HabitState = {
  tasks: [],
  totalPoints: 0,
  completionLog: []
};

const createId = () => crypto.randomUUID?.() ?? Math.random().toString(16).slice(2);

const hydrateState = (): HabitState => {
  if (typeof window === "undefined") {
    return defaultState;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw) as Partial<HabitState> & { tasks?: Array<Partial<HabitTask>> };
    if (!parsed || !Array.isArray(parsed.tasks)) {
      return defaultState;
    }

    const today = todayKey();

    const tasks: HabitTask[] = parsed.tasks.map((task) => {
      const fallbackDate = normalizeDateKey(task.createdOn ?? task.lastCompletedOn ?? today);
      const frequencyCandidate = task.frequency;
      const hasFrequency =
        frequencyCandidate && typeof frequencyCandidate === "object" && "kind" in frequencyCandidate;
      const sanitizedFrequency = hasFrequency
        ? normalizeHabitFrequency(frequencyCandidate as HabitFrequency, fallbackDate)
        : ({ kind: "daily" } as HabitFrequency);

      return {
        id: task.id ?? createId(),
        title: task.title?.toString() ?? "Unnamed habit",
        type: task.type === "value" ? "value" : "checkbox",
        frequency: sanitizedFrequency,
        streak: Number.isFinite(task.streak) ? Number(task.streak) : 0,
        lastCompletedOn: task.lastCompletedOn ?? null,
        createdOn: fallbackDate,
        valueUnit: task.valueUnit?.toString(),
        defaultTargetValue: Number.isFinite(task.defaultTargetValue)
          ? Number(task.defaultTargetValue)
          : undefined
      };
    });

    const completionLog: HabitCompletion[] = Array.isArray(parsed.completionLog)
      ? parsed.completionLog
          .map((entry) => ({
            id: entry.id ?? createId(),
            taskId: entry.taskId ?? "",
            taskTitle: entry.taskTitle?.toString() ?? "Habit",
            completedOn: entry.completedOn ?? today,
            value:
              typeof entry.value === "number" && Number.isFinite(entry.value) ? entry.value : undefined,
            pointsAwarded: Number.isFinite(entry.pointsAwarded) ? Number(entry.pointsAwarded) : 0
          }))
          .filter((entry) => entry.taskId)
      : [];

    return {
      tasks,
      totalPoints: Number.isFinite(parsed.totalPoints) ? Number(parsed.totalPoints) : 0,
      completionLog
    };
  } catch (error) {
    console.warn("[routinely] Failed to hydrate state", error);
    return defaultState;
  }
};

export type HabitStore = {
  tasks: HabitTask[];
  totalPoints: number;
  tasksCompletedToday: number;
  tasksDueToday: number;
  completionLog: HabitCompletion[];
  addTask: (input: NewHabitInput) => void;
  updateTask: (taskId: string, input: NewHabitInput) => void;
  removeTask: (taskId: string) => void;
  completeTask: (taskId: string, options?: CompleteHabitOptions) => RewardDetails | null;
  resetAll: () => void;
};

export const useHabitStore = (): HabitStore => {
  const [state, setState] = useState<HabitState>(() => hydrateState());

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const addTask = useCallback((input: NewHabitInput) => {
    const title = input.title.trim();
    if (!title) return;

    setState((prev) => {
      const createdOn = todayKey();
      const frequency = normalizeHabitFrequency(input.frequency, createdOn);

      const task: HabitTask = {
        id: createId(),
        title,
        type: input.type,
        frequency,
        streak: 0,
        lastCompletedOn: null,
        createdOn,
        valueUnit: input.valueUnit?.trim() ? input.valueUnit.trim() : undefined,
        defaultTargetValue:
          typeof input.defaultTargetValue === "number" && Number.isFinite(input.defaultTargetValue)
            ? input.defaultTargetValue
            : undefined
      };

      return {
        ...prev,
        tasks: [...prev.tasks, task]
      };
    });
  }, []);

  const updateTask = useCallback((taskId: string, input: NewHabitInput) => {
    const title = input.title.trim();
    if (!title) return;

    setState((prev) => {
      let updatedTask: HabitTask | null = null;

      const tasks = prev.tasks.map((task) => {
        if (task.id !== taskId) {
          return task;
        }

        const frequency = normalizeHabitFrequency(input.frequency, task.createdOn);
        const sanitizedDefaultValue =
          input.type === "value" && typeof input.defaultTargetValue === "number"
            ? (Number.isFinite(input.defaultTargetValue) ? input.defaultTargetValue : undefined)
            : undefined;

        updatedTask = {
          ...task,
          title,
          type: input.type,
          frequency,
          valueUnit: input.type === "value" ? input.valueUnit?.trim() || undefined : undefined,
          defaultTargetValue: sanitizedDefaultValue
        };
        return updatedTask;
      });

      if (!updatedTask) {
        return prev;
      }

      return {
        ...prev,
        tasks,
        completionLog: prev.completionLog.map((entry) =>
          entry.taskId === taskId ? { ...entry, taskTitle: updatedTask!.title } : entry
        )
      };
    });
  }, []);

  const removeTask = useCallback((taskId: string) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((task) => task.id !== taskId),
      completionLog: prev.completionLog.filter((entry) => entry.taskId !== taskId)
    }));
  }, []);

  const completeTask = useCallback(
    (taskId: string, options: CompleteHabitOptions = {}): RewardDetails | null => {
      const today = todayKey();
      let reward: RewardDetails | null = null;

      setState((prev) => {
        let pendingPenalty = 0;

        const tasks = prev.tasks.map((task) => {
          if (task.id !== taskId) {
            return task;
          }

          if (isSameDay(task.lastCompletedOn, today) || !isHabitDueOnDate(task, today)) {
            reward = null;
            return task;
          }

          const missedOccurrences = countDueOccurrencesBetween(task, task.lastCompletedOn, today);
          pendingPenalty = missedOccurrences * MISSED_OCCURRENCE_PENALTY;
          const consecutive = missedOccurrences === 0 && isConsecutiveCompletion(task, today);
          const newStreak = consecutive ? task.streak + 1 : 1;
          const pointsAwarded = 10 + newStreak * 2;
          const valueRecorded =
            task.type === "value" && typeof options.value === "number" && Number.isFinite(options.value)
              ? options.value
              : undefined;

          reward = {
            taskId,
            taskTitle: task.title,
            pointsAwarded,
            newStreak,
            missedOccurrences,
            penaltyApplied: pendingPenalty,
            valueRecorded,
            valueUnit: task.valueUnit
          };

          return {
            ...task,
            streak: newStreak,
            lastCompletedOn: today
          };
        });

        if (!reward) {
          return prev;
        }

        return {
          tasks,
          totalPoints: Math.max(0, prev.totalPoints - pendingPenalty + reward.pointsAwarded),
          completionLog: [
            ...prev.completionLog,
            {
              id: createId(),
              taskId,
              taskTitle: reward.taskTitle,
              completedOn: today,
              value: reward.valueRecorded,
              pointsAwarded: reward.pointsAwarded
            }
          ].slice(-COMPLETION_LOG_LIMIT)
        };
      });

      return reward;
    },
    []
  );

  const resetAll = useCallback(() => {
    setState(defaultState);
  }, []);

  const { tasksCompletedToday, tasksDueToday } = useMemo(() => {
    const today = todayKey();
    let completed = 0;
    let due = 0;

    state.tasks.forEach((task) => {
      if (!isHabitDueOnDate(task, today)) {
        return;
      }

      due += 1;
      if (isSameDay(task.lastCompletedOn, today)) {
        completed += 1;
      }
    });

    return {
      tasksCompletedToday: completed,
      tasksDueToday: due
    };
  }, [state.tasks]);

  return {
    tasks: state.tasks,
    totalPoints: state.totalPoints,
    tasksCompletedToday,
    tasksDueToday,
    completionLog: state.completionLog,
    addTask,
    updateTask,
    removeTask,
    completeTask,
    resetAll
  };
};
