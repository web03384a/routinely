import { motion, useAnimationControls } from "framer-motion";
import { useEffect } from "react";

type PointsGalaxyPanelProps = {
  totalPoints: number;
  completedToday: number;
  dueToday: number;
};

export const PointsGalaxyPanel = ({
  totalPoints,
  completedToday,
  dueToday
}: PointsGalaxyPanelProps) => {
  const controls = useAnimationControls();
  const completionRatio = dueToday === 0 ? 1 : completedToday / dueToday;
  const completionPercent = Math.round(Math.min(1, Math.max(0, completionRatio)) * 100);
  const progressLabel =
    dueToday === 0
      ? "Nothing scheduled today—enjoy the pause."
      : `${completedToday} / ${dueToday} habit${dueToday === 1 ? "" : "s"} glowing today`;

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
          {progressLabel}
        </p>
      </div>
    </motion.div>
  );
};
