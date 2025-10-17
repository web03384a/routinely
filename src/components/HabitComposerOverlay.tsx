import { useEffect } from "react";
import { motion } from "framer-motion";
import type { NewHabitInput } from "../hooks/useHabitStore";
import { HabitComposer } from "./HabitComposer";

type HabitComposerOverlayProps = {
  onCreateHabit: (input: NewHabitInput) => void;
  onCancel: () => void;
};

export const HabitComposerOverlay = ({ onCreateHabit, onCancel }: HabitComposerOverlayProps) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  return (
    <div className="habit-editor habit-editor--composer">
      <motion.div
        className="habit-editor__backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCancel}
      />
      <motion.div
        className="habit-editor__panel habit-editor__panel--composer"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.94 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        <div className="habit-editor__header">
          <h2 className="habit-editor__title">Create a habit</h2>
          <button type="button" className="habit-editor__button habit-editor__button--ghost" onClick={onCancel}>
            Cancel
          </button>
        </div>
        <HabitComposer onCreateHabit={onCreateHabit} />
      </motion.div>
    </div>
  );
};
