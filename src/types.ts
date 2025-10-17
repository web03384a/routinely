export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type HabitFrequencyDaily = {
  kind: "daily";
};

export type HabitFrequencyWeekly = {
  kind: "weekly";
  daysOfWeek: Weekday[];
};

export type HabitFrequencyInterval = {
  kind: "interval";
  intervalDays: number;
  anchorDate: string;
};

export type HabitFrequency =
  | HabitFrequencyDaily
  | HabitFrequencyWeekly
  | HabitFrequencyInterval;

export type HabitType = "checkbox" | "value";

export type HabitTask = {
  id: string;
  title: string;
  type: HabitType;
  frequency: HabitFrequency;
  streak: number;
  lastCompletedOn: string | null;
  createdOn: string;
  valueUnit?: string;
  defaultTargetValue?: number;
};

export type HabitCompletion = {
  id: string;
  taskId: string;
  taskTitle: string;
  completedOn: string;
  value?: number;
  pointsAwarded: number;
};

export type GamificationSnapshot = {
  totalPoints: number;
  lastUpdatedOn: string | null;
};
