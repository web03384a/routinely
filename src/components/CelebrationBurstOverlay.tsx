import { AnimatePresence, motion } from "framer-motion";
import { useMemo } from "react";
import type { RewardDetails } from "../hooks/useHabitStore";

type CelebrationBurstOverlayProps = {
  reward: (RewardDetails & { visualId: string }) | null;
  onClose: () => void;
};

const confettiPalette = ["#FF4D8D", "#FFD447", "#6D4BFF", "#4BE1BA", "#FF9153"];

export const CelebrationBurstOverlay = ({ reward, onClose }: CelebrationBurstOverlayProps) => {
  const rewardId = reward?.visualId;
  const sparkShapes = useMemo(() => {
    if (!rewardId) return [];
    return Array.from({ length: 12 }, (_, index) => {
      const color = confettiPalette[index % confettiPalette.length];
      const distance = 80 + Math.random() * 50;
      const angle = (index / 12) * 360 + Math.random() * 20;
      return { color, distance, angle };
    });
  }, [rewardId]);

  return (
    <AnimatePresence>
      {reward && (
        <motion.div
          className="celebration-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={onClose}
        >
          <motion.div
            className="celebration-overlay__core"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 18 }}
          >
            <motion.div
              className="celebration-overlay__burst"
              initial={{ scale: 0 }}
              animate={{ scale: 1.2 }}
              exit={{ scale: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
            <h4 className="celebration-overlay__headline">+{reward.pointsAwarded} points!</h4>
            <p className="celebration-overlay__message">
              <strong>{reward.taskTitle}</strong> streak is now {reward.newStreak} check-in
              {reward.newStreak === 1 ? "" : "s"}!
            </p>
            {typeof reward.valueRecorded === "number" && (
              <p className="celebration-overlay__message">
                Logged {reward.valueRecorded}
                {reward.valueUnit ? ` ${reward.valueUnit}` : ""}
              </p>
            )}
            {reward.missedOccurrences > 0 && (
              <p className="celebration-overlay__message celebration-overlay__message--penalty">
                Missed {reward.missedOccurrences} scheduled check-in
                {reward.missedOccurrences === 1 ? "" : "s"} ·
                <span className="celebration-overlay__penalty"> -{reward.penaltyApplied} points</span>
              </p>
            )}
            <div className="celebration-overlay__sparks">
              {sparkShapes.map((spark, index) => (
                <motion.span
                  key={`${rewardId}-${index}`}
                  className="celebration-overlay__spark"
                  style={{
                    backgroundColor: spark.color,
                    transform: `rotate(${spark.angle}deg) translate(${spark.distance}px)`
                  }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.02 }}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
