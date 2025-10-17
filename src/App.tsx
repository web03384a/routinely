import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { CelebrationBurstOverlay } from "./components/CelebrationBurstOverlay";
import { HabitComposer } from "./components/HabitComposer";
import { HabitList } from "./components/HabitList";
import { HabitSummaryPanel } from "./components/HabitSummaryPanel";
import { PointsGalaxyPanel } from "./components/PointsGalaxyPanel";
import { HabitEditorOverlay } from "./components/HabitEditorOverlay";
import type { CompleteHabitOptions, NewHabitInput, RewardDetails } from "./hooks/useHabitStore";
import { useHabitStore } from "./hooks/useHabitStore";
import type { HabitTask } from "./types";
import "./styles/app.css";

type ActiveReward = (RewardDetails & { visualId: string }) | null;

const App = () => {
  const {
    addTask,
    completeTask,
    removeTask,
    updateTask,
    tasks,
    tasksCompletedToday,
    totalPoints,
    completionLog
  } = useHabitStore();
  const [activeReward, setActiveReward] = useState<ActiveReward>(null);
  const [editingHabit, setEditingHabit] = useState<HabitTask | null>(null);

  const totalHabits = tasks.length;

  const handleCompleteHabit = (taskId: string, options?: CompleteHabitOptions) => {
    const reward = completeTask(taskId, options);
    if (!reward) return;

    setActiveReward({
      ...reward,
      visualId: crypto.randomUUID?.() ?? Math.random().toString(16).slice(2)
    });
  };

  const handleCreateHabit = (input: NewHabitInput) => {
    addTask(input);
  };

  const handleSaveHabit = (input: NewHabitInput) => {
    if (!editingHabit) return;
    updateTask(editingHabit.id, input);
    setEditingHabit(null);
  };

  useEffect(() => {
    if (!activeReward) return;
    const timeout = window.setTimeout(() => setActiveReward(null), 1800);
    return () => window.clearTimeout(timeout);
  }, [activeReward]);

  return (
    <div className="app-shell">
      <motion.main
        className="app-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <header className="app-card__header">
          <h1 className="app-card__title">
            Routinely
            <span className="app-card__subtitle">Daily joy tracker</span>
          </h1>
          <PointsGalaxyPanel
            totalPoints={totalPoints}
            completedToday={tasksCompletedToday}
            totalHabits={totalHabits}
          />
        </header>

        <section className="app-card__section">
          <HabitComposer onCreateHabit={handleCreateHabit} />
        </section>

        <section className="app-card__section">
          <HabitList
            tasks={tasks}
            onCompleteHabit={handleCompleteHabit}
            onRemoveHabit={removeTask}
            onEditHabit={(task) => setEditingHabit(task)}
          />
        </section>

        <section className="app-card__section">
          <HabitSummaryPanel completionLog={completionLog} tasks={tasks} />
        </section>

        <footer className="app-card__footer">
          <p>Tap a habit each day to keep your streak glowing and earn more joy points.</p>
        </footer>
      </motion.main>

      <CelebrationBurstOverlay reward={activeReward} onClose={() => setActiveReward(null)} />
      {editingHabit && (
        <HabitEditorOverlay
          habit={editingHabit}
          onSave={handleSaveHabit}
          onCancel={() => setEditingHabit(null)}
        />
      )}
    </div>
  );
};

export default App;
