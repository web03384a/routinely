import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { motion } from "framer-motion";
import type { NewHabitInput } from "../hooks/useHabitStore";
import type { HabitTask, HabitType, Weekday } from "../types";
import { addDays, getWeekday, todayKey } from "../utils/date";

type HabitEditorOverlayProps = {
  habit: HabitTask;
  onSave: (input: NewHabitInput) => void;
  onCancel: () => void;
};

type FrequencyMode = "daily" | "weekly" | "bi-weekly";

const weekdayLabels: Record<Weekday, string> = {
  0: "Sun",
  1: "Mon",
  2: "Tue",
  3: "Wed",
  4: "Thu",
  5: "Fri",
  6: "Sat"
};

const deriveFrequencyMode = (habit: HabitTask): FrequencyMode => {
  if (habit.frequency.kind === "daily") {
    return "daily";
  }

  if (habit.frequency.kind === "weekly") {
    return "weekly";
  }

  return habit.frequency.intervalDays === 14 ? "bi-weekly" : "weekly";
};

const deriveSelectedDays = (habit: HabitTask, mode: FrequencyMode): Weekday[] => {
  if (mode === "daily") {
    return [getWeekday(todayKey())];
  }

  if (habit.frequency.kind === "weekly") {
    return [...habit.frequency.daysOfWeek].sort((a, b) => a - b) as Weekday[];
  }

  if (habit.frequency.kind === "interval") {
    const anchor = habit.frequency.anchorDate ?? habit.createdOn;
    return [getWeekday(anchor)];
  }

  return [getWeekday(habit.createdOn)];
};

const nextAnchorFor = (weekday: Weekday, startFrom: string): string => {
  let anchor = startFrom;
  let attempts = 0;
  while (getWeekday(anchor) !== weekday && attempts < 7) {
    anchor = addDays(anchor, 1);
    attempts += 1;
  }
  return anchor;
};

export const HabitEditorOverlay = ({ habit, onSave, onCancel }: HabitEditorOverlayProps) => {
  const [title, setTitle] = useState(habit.title);
  const [habitType, setHabitType] = useState<HabitType>(habit.type);
  const [frequencyMode, setFrequencyMode] = useState<FrequencyMode>(deriveFrequencyMode(habit));
  const [selectedDays, setSelectedDays] = useState<Weekday[]>(
    deriveSelectedDays(habit, deriveFrequencyMode(habit))
  );
  const [valueUnit, setValueUnit] = useState(habit.valueUnit ?? "");
  const [defaultTargetValue, setDefaultTargetValue] = useState(
    habit.defaultTargetValue?.toString() ?? ""
  );

  useEffect(() => {
    setTitle(habit.title);
    setHabitType(habit.type);
    const mode = deriveFrequencyMode(habit);
    setFrequencyMode(mode);
    setSelectedDays(deriveSelectedDays(habit, mode));
    setValueUnit(habit.valueUnit ?? "");
    setDefaultTargetValue(habit.defaultTargetValue?.toString() ?? "");
  }, [habit]);

  const isTitleValid = title.trim().length > 0;
  const isWeeklyValid = frequencyMode === "daily" || selectedDays.length > 0;
  const isFormValid = isTitleValid && isWeeklyValid;

  const frequencyPreview = useMemo(() => {
    if (frequencyMode === "daily") return "Every day";
    const labels = selectedDays.map((day) => weekdayLabels[day]);
    if (frequencyMode === "weekly") {
      return labels.length === 0 ? "Choose days" : labels.join(", ");
    }
    return labels[0] ? `Every other week on ${labels[0]}` : "Choose a day";
  }, [frequencyMode, selectedDays]);

  useEffect(() => {
    if (frequencyMode !== "daily" && selectedDays.length === 0) {
      setSelectedDays([getWeekday(todayKey())]);
      return;
    }

    if (frequencyMode === "bi-weekly" && selectedDays.length > 1) {
      setSelectedDays([selectedDays[0]]);
    }
  }, [frequencyMode, selectedDays]);

  const handleDayToggle = (day: Weekday) => {
    setSelectedDays((prev) => {
      if (frequencyMode === "bi-weekly") {
        return [day];
      }
      if (prev.includes(day)) {
        return prev.filter((value) => value !== day);
      }
      return [...prev, day].sort((a, b) => a - b);
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isFormValid) return;

    const reference = habit.lastCompletedOn ?? habit.createdOn;
    let frequency: NewHabitInput["frequency"];
    if (frequencyMode === "daily") {
      frequency = { kind: "daily" };
    } else if (frequencyMode === "weekly") {
      frequency = { kind: "weekly", daysOfWeek: selectedDays };
    } else {
      const base = nextAnchorFor(selectedDays[0] ?? getWeekday(reference), reference);
      frequency = {
        kind: "interval",
        intervalDays: 14,
        anchorDate: base
      };
    }

    const defaultTargetNumeric = Number(defaultTargetValue);

    const payload: NewHabitInput = {
      title,
      type: habitType,
      frequency,
      valueUnit: habitType === "value" ? valueUnit.trim() || undefined : undefined,
      defaultTargetValue:
        habitType === "value" && defaultTargetValue.trim().length > 0 && Number.isFinite(defaultTargetNumeric)
          ? defaultTargetNumeric
          : undefined
    };

    onSave(payload);
  };

  return (
    <div className="habit-editor">
      <motion.div
        className="habit-editor__backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCancel}
      />
      <motion.form
        className="habit-editor__panel"
        onSubmit={handleSubmit}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.94 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        <h2 className="habit-editor__title">Edit habit</h2>
        <label className="habit-editor__field">
          <span className="habit-editor__label">Name</span>
          <input
            className="habit-composer__input"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>

        <label className="habit-editor__field">
          <span className="habit-editor__label">Type</span>
          <select
            className="habit-composer__select"
            value={habitType}
            onChange={(event) => setHabitType(event.target.value as HabitType)}
          >
            <option value="checkbox">Check-in</option>
            <option value="value">Value based</option>
          </select>
        </label>

        <label className="habit-editor__field">
          <span className="habit-editor__label">Frequency</span>
          <select
            className="habit-composer__select"
            value={frequencyMode}
            onChange={(event) => setFrequencyMode(event.target.value as FrequencyMode)}
          >
            <option value="daily">Daily</option>
            <option value="weekly">Specific days each week</option>
            <option value="bi-weekly">Every other week</option>
          </select>
        </label>

        {frequencyMode !== "daily" && (
          <div className="habit-editor__field">
            <span className="habit-editor__label">Days</span>
            <div className="habit-composer__days">
              {Object.entries(weekdayLabels).map(([value, label]) => {
                const day = Number(value) as Weekday;
                const active = selectedDays.includes(day);
                return (
                  <button
                    key={value}
                    type="button"
                    className={`habit-composer__day ${active ? "habit-composer__day--active" : ""}`}
                    onClick={() => handleDayToggle(day)}
                    aria-pressed={active}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <p className="habit-editor__hint">{frequencyPreview}</p>
          </div>
        )}

        {habitType === "value" && (
          <div className="habit-editor__grid">
            <label className="habit-editor__field">
              <span className="habit-editor__label">Unit</span>
              <input
                className="habit-composer__input"
                type="text"
                value={valueUnit}
                onChange={(event) => setValueUnit(event.target.value)}
              />
            </label>
            <label className="habit-editor__field">
              <span className="habit-editor__label">Typical target</span>
              <input
                className="habit-composer__input"
                type="number"
                min="0"
                step="0.5"
                value={defaultTargetValue}
                onChange={(event) => setDefaultTargetValue(event.target.value)}
              />
            </label>
          </div>
        )}

        <div className="habit-editor__actions">
          <button type="button" className="habit-editor__button habit-editor__button--ghost" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="submit"
            className="habit-editor__button"
            disabled={!isFormValid}
          >
            Save changes
          </button>
        </div>
      </motion.form>
    </div>
  );
};
