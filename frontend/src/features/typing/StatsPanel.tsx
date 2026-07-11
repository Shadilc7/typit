import { useEffect, useRef } from 'react';
import styles from './StatsPanel.module.css';

interface StatsPanelProps {
  wpm: number;
  accuracy: number;
  elapsedSeconds: number;
  errorCount: number;
  correctChars: number;
  totalChars: number;
  isStarted: boolean;
  isFinished: boolean;
}

/**
 * Live stats panel showing WPM, accuracy, time, and progress.
 * Updates in real-time as the user types.
 */
export function StatsPanel({
  wpm,
  accuracy,
  elapsedSeconds,
  errorCount,
  correctChars,
  totalChars,
  isStarted,
  isFinished,
}: StatsPanelProps) {
  const timerRef = useRef<HTMLSpanElement>(null);
  const animFrameRef = useRef<number>();
  const startTimeRef = useRef<number | null>(null);

  // Smooth timer animation using requestAnimationFrame
  useEffect(() => {
    if (isStarted && !isFinished) {
      if (!startTimeRef.current) {
        startTimeRef.current = performance.now() - (elapsedSeconds * 1000);
      }
      const tick = () => {
        if (timerRef.current && startTimeRef.current) {
          const elapsed = (performance.now() - startTimeRef.current) / 1000;
          timerRef.current.textContent = formatTime(elapsed);
        }
        animFrameRef.current = requestAnimationFrame(tick);
      };
      animFrameRef.current = requestAnimationFrame(tick);
    }

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isStarted, isFinished, elapsedSeconds]);

  // Reset timer ref when not started
  useEffect(() => {
    if (!isStarted) {
      startTimeRef.current = null;
    }
  }, [isStarted]);

  const progress = totalChars > 0 ? (correctChars / totalChars) * 100 : 0;

  return (
    <div className={styles.container} id="stats-panel">
      <div className={styles.statsGrid}>
        {/* WPM */}
        <div className={`${styles.statCard} ${styles.wpmCard}`}>
          <span className={styles.statLabel}>WPM</span>
          <span className={styles.statValue}>
            {isStarted ? Math.round(wpm) : '—'}
          </span>
        </div>

        {/* Accuracy */}
        <div className={`${styles.statCard} ${styles.accuracyCard}`}>
          <span className={styles.statLabel}>Accuracy</span>
          <span className={styles.statValue}>
            {isStarted ? `${accuracy.toFixed(1)}%` : '—'}
          </span>
        </div>

        {/* Time */}
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Time</span>
          <span className={styles.statValue} ref={timerRef}>
            {isFinished ? formatTime(elapsedSeconds) : isStarted ? '...' : '—'}
          </span>
        </div>

        {/* Errors */}
        <div className={`${styles.statCard} ${errorCount > 0 ? styles.errorCard : ''}`}>
          <span className={styles.statLabel}>Errors</span>
          <span className={styles.statValue}>
            {isStarted ? errorCount : '—'}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className={styles.progressContainer}>
        <div className={styles.progressTrack}>
          <div
            className={styles.progressFill}
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className={styles.progressLabel}>
          {correctChars} / {totalChars} chars
        </span>
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 10);
  if (mins > 0) {
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`;
  }
  return `${secs}.${ms}s`;
}
