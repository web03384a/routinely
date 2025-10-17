import { motion, useAnimationControls } from "framer-motion";
import { useEffect } from "react";

type PointsGalaxyPanelProps = {
  totalPoints: number;
  completedToday: number;
  totalHabits: number;
};

export const PointsGalaxyPanel = ({
  totalPoints,
  completedToday,
  totalHabits
}: PointsGalaxyPanelProps) => {
  const controls = useAnimationControls();
  const completionRatio = totalHabits === 0 ? 0 : completedToday / totalHabits;
  const completionPercent = Math.round(completionRatio * 100);

  useEffect(() => {
    controls.start({
      scale: [1, 1.15, 1],
      rotate: [0, -3, 3, 0],
      transition: { duration: 0.8, ease: "easeOut" }
    });
  }, [totalPoints, controls]);

  return (
    <motion.div className="points-galaxy" animate={controls}>
      <div className="points-galaxy__total">
        <span className="points-galaxy__label">Joy points</span>
        <span className="points-galaxy__value">{totalPoints}</span>
      </div>
      <div className="points-galaxy__progress">
        <div className="points-galaxy__progress-header">
          <span>Today&apos;s sparkle</span>
          <strong>{completionPercent}%</strong>
        </div>
        <div className="points-galaxy__bar">
          <motion.span
            className="points-galaxy__bar-fill"
            initial={{ width: 0 }}
            animate={{ width: `${completionPercent}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
        <p className="points-galaxy__count">
          {completedToday} / {totalHabits || "none"} habits glowing today
        </p>
      </div>
    </motion.div>
  );
};
