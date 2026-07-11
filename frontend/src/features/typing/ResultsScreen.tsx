import type { TypingStats } from './useTypingEngine';
import styles from './ResultsScreen.module.css';

interface ResultsScreenProps {
  stats: TypingStats;
  snippetLength: number;
  language: string;
  onPlayAgain: () => void;
  actionLabel?: string;
}

/**
 * Final results screen shown after completing a snippet.
 * Displays WPM, accuracy, time, errors, and characters per second.
 */
export function ResultsScreen({
  stats,
  snippetLength,
  language,
  onPlayAgain,
  actionLabel = "New Snippet",
}: ResultsScreenProps) {
  const grade = getGrade(stats.wpm, stats.accuracy);

  return (
    <div className={styles.overlay} id="results-screen">
      <div className={styles.card}>
        {/* Grade badge */}
        <div className={styles.gradeBadge} data-grade={grade.letter}>
          <span className={styles.gradeLetter}>{grade.letter}</span>
          <span className={styles.gradeLabel}>{grade.label}</span>
        </div>

        <h2 className={styles.title}>Race Complete!</h2>

        {/* Main stats */}
        <div className={styles.mainStats}>
          <div className={styles.mainStat}>
            <span className={styles.mainStatValue}>{Math.round(stats.wpm)}</span>
            <span className={styles.mainStatLabel}>WPM</span>
          </div>
          <div className={styles.divider} />
          <div className={styles.mainStat}>
            <span className={styles.mainStatValue}>{stats.accuracy.toFixed(1)}%</span>
            <span className={styles.mainStatLabel}>Accuracy</span>
          </div>
        </div>

        {/* Detail stats */}
        <div className={styles.detailGrid}>
          <div className={styles.detailItem}>
            <span className={styles.detailIcon}>⏱</span>
            <div>
              <span className={styles.detailValue}>{formatDuration(stats.elapsedSeconds)}</span>
              <span className={styles.detailLabel}>Time</span>
            </div>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailIcon}>❌</span>
            <div>
              <span className={styles.detailValue}>{stats.errorCount}</span>
              <span className={styles.detailLabel}>Errors</span>
            </div>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailIcon}>⌨️</span>
            <div>
              <span className={styles.detailValue}>{stats.totalKeystrokes}</span>
              <span className={styles.detailLabel}>Keystrokes</span>
            </div>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailIcon}>📝</span>
            <div>
              <span className={styles.detailValue}>{snippetLength}</span>
              <span className={styles.detailLabel}>Characters</span>
            </div>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailIcon}>⚡</span>
            <div>
              <span className={styles.detailValue}>{stats.charsPerSecond}</span>
              <span className={styles.detailLabel}>Chars/sec</span>
            </div>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailIcon}>🏷️</span>
            <div>
              <span className={styles.detailValue}>{language}</span>
              <span className={styles.detailLabel}>Language</span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className={styles.actions}>
          <button
            className={styles.playAgainBtn}
            onClick={onPlayAgain}
            id="play-again-button"
          >
            <span className={styles.btnIcon}>🔄</span>
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Helpers ─── */

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  if (mins > 0) {
    return `${mins}m ${secs}s`;
  }
  return `${secs}.${Math.floor((seconds % 1) * 10)}s`;
}

interface Grade {
  letter: string;
  label: string;
}

function getGrade(wpm: number, accuracy: number): Grade {
  const score = wpm * (accuracy / 100);
  if (score >= 80) return { letter: 'S', label: 'Legendary' };
  if (score >= 60) return { letter: 'A', label: 'Excellent' };
  if (score >= 45) return { letter: 'B', label: 'Great' };
  if (score >= 30) return { letter: 'C', label: 'Good' };
  if (score >= 15) return { letter: 'D', label: 'Fair' };
  return { letter: 'F', label: 'Keep Practicing' };
}
