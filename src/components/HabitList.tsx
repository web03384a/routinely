import { motion } from "framer-motion";
import type { CompleteHabitOptions } from "../hooks/useHabitStore";
import type { HabitTask } from "../types";
import { addDays, isSameDay, todayKey } from "../utils/date";
import { isHabitDueOnDate } from "../utils/habits";

type HabitListProps = {
  tasks: HabitTask[];
  onCompleteHabit: (taskId: string, options?: CompleteHabitOptions) => void;
  onRemoveHabit: (taskId: string) => void;
};

const listVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

const STREAK_PROGRESS_TARGET = 30;

const formatDueLabel = (task: HabitTask, today: string): string => {
  if (isHabitDueOnDate(task, today)) {
    return "Due today";
  }

  let cursor = today;
  for (let i = 1; i <= 60; i++) {
    cursor = addDays(cursor, 1);
    if (isHabitDueOnDate(task, cursor)) {
      const targetDate = new Date(cursor);
      const diff = Math.round((targetDate.getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24));
      if (diff === 1) return "Due tomorrow";
      const dayName = targetDate.toLocaleDateString(undefined, { weekday: "short" });
      return `Next: ${dayName}`;
    }
  }
  return "Scheduled later";
};

const describeFrequency = (task: HabitTask): string => {
  if (task.frequency.kind === "daily") {
    return "Daily cadence";
  }
  if (task.frequency.kind === "weekly") {
    const formatter = new Intl.DateTimeFormat(undefined, { weekday: "short" });
    const sample = task.frequency.daysOfWeek
      .map((day) => {
        const base = new Date();
        base.setDate(base.getDate() - base.getDay() + day);
        return formatter.format(base);
      })
      .join(", ");
    return task.frequency.daysOfWeek.length > 1 ? `Weekly on ${sample}` : `Every ${sample}`;
  }
  const next = new Date(task.frequency.anchorDate);
  const weekday = next.toLocaleDateString(undefined, { weekday: "long" });
  return `Every ${task.frequency.intervalDays} days · starts ${weekday}`;
};

export const HabitList = ({ tasks, onCompleteHabit, onRemoveHabit }: HabitListProps) => {
  const today = todayKey();

  if (tasks.length === 0) {
    return (
      <motion.div
        className="habit-list__empty"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      >
        <p className="habit-list__empty-title">Let&apos;s build a bright routine!</p>
        <p className="habit-list__empty-subtitle">Add daily actions and tap them when you shine.</p>
      </motion.div>
    );
  }

  return (
    <motion.ul
      className="habit-list"
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
    >
      {tasks.map((task) => {
        const completedToday = isSameDay(task.lastCompletedOn, today);
        const dueLabel = formatDueLabel(task, today);
        const isDueToday = isHabitDueOnDate(task, today);
        const progressPercent = Math.min(
          100,
          Math.round((task.streak / STREAK_PROGRESS_TARGET) * 100)
        );
        const handleComplete = () => {
          if (task.type === "value") {
            const suggestion = task.defaultTargetValue?.toString() ?? "";
            const raw = window.prompt(`Record ${task.title}`, suggestion);
            if (raw === null) return;
            const parsed = Number(raw);
            if (!Number.isFinite(parsed) || parsed < 0) {
              window.alert("Please enter a valid number to log this habit.");
              return;
            }
            onCompleteHabit(task.id, { value: parsed });
            return;
          }
          onCompleteHabit(task.id);
        };
        return (
          <motion.li key={task.id} className="habit-card" variants={listVariants}>
            <div className="habit-card__details">
              <h3 className="habit-card__title">{task.title}</h3>
              <p className="habit-card__streak">
                Streak: {task.streak} day{task.streak === 1 ? "" : "s"} strong
              </p>
              <p className="habit-card__meta">{describeFrequency(task)}</p>
              {task.type === "value" && (
                <p className="habit-card__meta">
                  Typical target: {task.defaultTargetValue ?? "–"}
                  {task.valueUnit ? ` ${task.valueUnit}` : ""}
                </p>
              )}
              <p className="habit-card__meta habit-card__meta--due">{dueLabel}</p>
              <div className="habit-card__progress">
                <div className="habit-card__progress-track" aria-hidden="true">
                  <motion.span
                    className="habit-card__progress-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                </div>
                <span className="habit-card__progress-label">
                  {progressPercent}% of {STREAK_PROGRESS_TARGET}-day arc
                </span>
              </div>
            </div>
            <div className="habit-card__actions">
              <motion.button
                className="habit-card__complete"
                onClick={handleComplete}
                disabled={completedToday || !isDueToday}
                whileTap={{ scale: completedToday || !isDueToday ? 1 : 0.9 }}
                animate={{ opacity: completedToday || !isDueToday ? 0.6 : 1 }}
              >
                {completedToday ? "Done!" : isDueToday ? "Complete" : "Not today"}
              </motion.button>
              <motion.button
                className="habit-card__remove"
                onClick={() => onRemoveHabit(task.id)}
                whileTap={{ scale: 0.92 }}
                aria-label={`Remove ${task.title}`}
              >
                x
              </motion.button>
            </div>
          </motion.li>
        );
      })}
    </motion.ul>
  );
};
