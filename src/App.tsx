import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { CelebrationBurstOverlay } from "./components/CelebrationBurstOverlay";
import { HabitComposerOverlay } from "./components/HabitComposerOverlay";
import { HabitList } from "./components/HabitList";
import { HabitSummaryPanel } from "./components/HabitSummaryPanel";
import { PointsGalaxyPanel } from "./components/PointsGalaxyPanel";
import type { CompleteHabitOptions, NewHabitInput, RewardDetails } from "./hooks/useHabitStore";
import { useHabitStore } from "./hooks/useHabitStore";
import "./styles/app.css";

type ActiveReward = (RewardDetails & { visualId: string }) | null;

const App = () => {
  const {
    addTask,
    completeTask,
    removeTask,
    tasks,
    tasksCompletedToday,
    tasksDueToday,
    totalPoints,
    completionLog
  } = useHabitStore();
  const [activeReward, setActiveReward] = useState<ActiveReward>(null);
  const [isComposerOpen, setIsComposerOpen] = useState(false);

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
    setIsComposerOpen(false);
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
            dueToday={tasksDueToday}
          />
        </header>

        <section className="app-card__section">
          <button
            type="button"
            className="habit-composer__button habit-composer__button--launcher"
            onClick={() => setIsComposerOpen(true)}
          >
            Add a new habit
          </button>
        </section>

        <section className="app-card__section">
          <HabitList
            tasks={tasks}
            onCompleteHabit={handleCompleteHabit}
            onRemoveHabit={removeTask}
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
      {isComposerOpen && (
        <HabitComposerOverlay
          onCreateHabit={handleCreateHabit}
          onCancel={() => setIsComposerOpen(false)}
        />
      )}
    </div>
  );
};

export default App;
