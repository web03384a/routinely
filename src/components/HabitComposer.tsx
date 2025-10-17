import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { motion } from "framer-motion";
import type { NewHabitInput } from "../hooks/useHabitStore";
import type { HabitType, Weekday } from "../types";
import { addDays, getWeekday, todayKey } from "../utils/date";

type HabitComposerProps = {
  onCreateHabit: (input: NewHabitInput) => void;
};

type FrequencyMode = "daily" | "weekly" | "bi-weekly";

const inputVariants = {
  focused: { scale: 1.02 },
  idle: { scale: 1 }
};

const weekdayLabels: Record<Weekday, string> = {
  0: "Sun",
  1: "Mon",
  2: "Tue",
  3: "Wed",
  4: "Thu",
  5: "Fri",
  6: "Sat"
};

const nextAnchorFor = (weekday: Weekday): string => {
  let anchor = todayKey();
  let attempts = 0;
  while ((getWeekday(anchor) as Weekday) !== weekday && attempts < 7) {
    anchor = addDays(anchor, 1);
    attempts += 1;
  }
  return anchor;
};

export const HabitComposer = ({ onCreateHabit }: HabitComposerProps) => {
  const [title, setTitle] = useState("");
  const [habitType, setHabitType] = useState<HabitType>("checkbox");
  const [frequencyMode, setFrequencyMode] = useState<FrequencyMode>("daily");
  const [selectedDays, setSelectedDays] = useState<Weekday[]>([
    getWeekday(todayKey()) as Weekday
  ]);
  const [valueUnit, setValueUnit] = useState("minutes");
  const [defaultTargetValue, setDefaultTargetValue] = useState("10");

  const isTitleValid = title.trim().length > 0;
  const isWeeklyValid = frequencyMode === "daily" || selectedDays.length > 0;
  const isFormValid = isTitleValid && isWeeklyValid;

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
      setSelectedDays([getWeekday(todayKey()) as Weekday]);
      return;
    }

    if (frequencyMode === "bi-weekly" && selectedDays.length > 1) {
      setSelectedDays([selectedDays[0]]);
    }
  }, [frequencyMode, selectedDays]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isFormValid) return;

    let frequency: NewHabitInput["frequency"];
    if (frequencyMode === "daily") {
      frequency = { kind: "daily" };
    } else if (frequencyMode === "weekly") {
      frequency = { kind: "weekly", daysOfWeek: selectedDays };
    } else {
      const anchorDay = selectedDays[0] ?? (getWeekday(todayKey()) as Weekday);
      frequency = {
        kind: "interval",
        intervalDays: 14,
        anchorDate: nextAnchorFor(anchorDay)
      };
    }

    const input: NewHabitInput = {
      title,
      type: habitType,
      frequency,
      valueUnit: habitType === "value" ? valueUnit.trim() || undefined : undefined,
      defaultTargetValue:
        habitType === "value" && defaultTargetValue.trim().length > 0
          ? Number(defaultTargetValue)
          : undefined
    };

    onCreateHabit(input);
    setTitle("");
    setHabitType("checkbox");
    setFrequencyMode("daily");
    setSelectedDays([getWeekday(todayKey()) as Weekday]);
    setDefaultTargetValue("10");
  };

  return (
    <motion.form
      className="habit-composer"
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <motion.input
        className="habit-composer__input"
        type="text"
        placeholder="Add a joyful routine..."
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        variants={inputVariants}
        whileFocus="focused"
        whileHover="focused"
        aria-label="Habit name"
      />
      <div className="habit-composer__row">
        <label className="habit-composer__label" htmlFor="habit-type">
          Type
        </label>
        <select
          id="habit-type"
          className="habit-composer__select"
          value={habitType}
          onChange={(event) => setHabitType(event.target.value as HabitType)}
        >
          <option value="checkbox">Check-in</option>
          <option value="value">Value based</option>
        </select>
      </div>

      <div className="habit-composer__row">
        <label className="habit-composer__label" htmlFor="habit-frequency">
          Frequency
        </label>
        <select
          id="habit-frequency"
          className="habit-composer__select"
          value={frequencyMode}
          onChange={(event) => setFrequencyMode(event.target.value as FrequencyMode)}
        >
          <option value="daily">Daily</option>
          <option value="weekly">Specific days each week</option>
          <option value="bi-weekly">Every other week</option>
        </select>
      </div>

      {frequencyMode !== "daily" && (
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
      )}

      <p className="habit-composer__preview" role="status">
        {frequencyPreview}
      </p>

      {habitType === "value" && (
        <div className="habit-composer__value">
          <div className="habit-composer__row">
            <label className="habit-composer__label" htmlFor="habit-value-unit">
              Unit
            </label>
            <input
              id="habit-value-unit"
              className="habit-composer__input"
              type="text"
              value={valueUnit}
              onChange={(event) => setValueUnit(event.target.value)}
            />
          </div>
          <div className="habit-composer__row">
            <label className="habit-composer__label" htmlFor="habit-default-target">
              Typical target
            </label>
            <input
              id="habit-default-target"
              className="habit-composer__input"
              type="number"
              min="0"
              step="0.5"
              value={defaultTargetValue}
              onChange={(event) => setDefaultTargetValue(event.target.value)}
            />
          </div>
        </div>
      )}

      <motion.button
        type="submit"
        className="habit-composer__button"
        whileTap={{ scale: 0.96 }}
        animate={{ opacity: isFormValid ? 1 : 0.6 }}
        disabled={!isFormValid}
      >
        Add
      </motion.button>
    </motion.form>
  );
};
