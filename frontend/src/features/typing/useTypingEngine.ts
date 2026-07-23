import { useState, useCallback, useRef } from 'react';
import { sound } from '../../services/sound';

/* ─── Types ─── */
export interface TypingStats {
  wpm: number;
  accuracy: number;
  correctChars: number;
  totalKeystrokes: number;
  errorCount: number;
  elapsedSeconds: number;
  charsPerSecond: number;
}

export interface TypingEngineState {
  /** The target snippet text */
  snippet: string;
  /** Current cursor position in the snippet */
  currentIndex: number;
  /** Array of character statuses: 'untyped' | 'correct' | 'incorrect' */
  charStatuses: CharStatus[];
  /** Whether the user has started typing */
  isStarted: boolean;
  /** Whether the user has completed the snippet */
  isFinished: boolean;
  /** Live stats */
  stats: TypingStats;
  /** The character the user typed at each position (for showing wrong chars) */
  typedChars: (string | null)[];
}

export type CharStatus = 'untyped' | 'correct' | 'incorrect';

export interface TypingEngineActions {
  /** Process a key press event */
  handleKeyDown: (e: React.KeyboardEvent) => void;
  /** Reset the engine with a new snippet */
  reset: (newSnippet?: string) => void;
}

export type UseTypingEngineReturn = TypingEngineState & TypingEngineActions;

/* ─── Helper: compute stats ─── */
function computeStats(
  startTime: number | null,
  endTime: number | null,
  correctChars: number,
  totalKeystrokes: number,
  errorIndices: Set<number>,
): TypingStats {
  if (!startTime) {
    return {
      wpm: 0,
      accuracy: 100,
      correctChars: 0,
      totalKeystrokes: 0,
      errorCount: 0,
      elapsedSeconds: 0,
      charsPerSecond: 0,
    };
  }

  const now = endTime ?? performance.now();
  const elapsedMs = now - startTime;
  const elapsedSeconds = elapsedMs / 1000;
  const elapsedMinutes = elapsedMs / 60000;

  // WPM = (correct characters / 5) / elapsed minutes
  // Guard against division by zero in the first instant
  const wpm = elapsedMinutes > 0.001
    ? (correctChars / 5) / elapsedMinutes
    : 0;

  // Accuracy = correct keystrokes / total keystrokes
  const accuracy = totalKeystrokes > 0
    ? (correctChars / totalKeystrokes) * 100
    : 100;

  const charsPerSecond = elapsedSeconds > 0.1
    ? correctChars / elapsedSeconds
    : 0;

  return {
    wpm: Math.round(wpm * 10) / 10,
    accuracy: Math.round(accuracy * 10) / 10,
    correctChars,
    totalKeystrokes,
    errorCount: errorIndices.size,
    elapsedSeconds: Math.round(elapsedSeconds * 10) / 10,
    charsPerSecond: Math.round(charsPerSecond * 10) / 10,
  };
}

/* ─── Hook ─── */
export function useTypingEngine(initialSnippet: string): UseTypingEngineReturn {
  const [snippet, setSnippet] = useState(initialSnippet);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [charStatuses, setCharStatuses] = useState<CharStatus[]>(
    () => new Array(initialSnippet.length).fill('untyped')
  );
  const [typedChars, setTypedChars] = useState<(string | null)[]>(
    () => new Array(initialSnippet.length).fill(null)
  );
  const [isStarted, setIsStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  // Use refs for values that change on every keystroke but shouldn't trigger re-renders
  const correctCharsRef = useRef(0);
  const totalKeystrokesRef = useRef(0);
  const errorIndicesRef = useRef<Set<number>>(new Set());
  const startTimeRef = useRef<number | null>(null);
  const endTimeRef = useRef<number | null>(null);

  // Expose as state for rendering (updated on each keystroke)
  const [stats, setStats] = useState<TypingStats>(() =>
    computeStats(null, null, 0, 0, new Set())
  );

  const updateStats = useCallback(() => {
    setStats(computeStats(
      startTimeRef.current,
      endTimeRef.current,
      correctCharsRef.current,
      totalKeystrokesRef.current,
      errorIndicesRef.current,
    ));
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Ignore if finished or if it's a modifier key
    if (isFinished) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;

    // Prevent default for Tab to avoid losing focus
    if (e.key === 'Tab') {
      e.preventDefault();
    }

    // Ignore non-character keys except Backspace, Tab, and Enter
    if (e.key.length > 1 && e.key !== 'Backspace' && e.key !== 'Tab' && e.key !== 'Enter') return;

    // Prevent paste
    if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
      e.preventDefault();
      return;
    }

    // Start timer on first keystroke
    if (!isStarted) {
      startTimeRef.current = performance.now();
      setIsStarted(true);
    }

    if (e.key === 'Backspace') {
      totalKeystrokesRef.current++;
      if (currentIndex > 0) {
        const newIndex = currentIndex - 1;
        // If the char we're going back to was correct, decrement correct count
        if (charStatuses[newIndex] === 'correct') {
          correctCharsRef.current--;
        }

        setCharStatuses(prev => {
          const next = [...prev];
          next[newIndex] = 'untyped';
          return next;
        });
        setTypedChars(prev => {
          const next = [...prev];
          next[newIndex] = null;
          return next;
        });
        setCurrentIndex(newIndex);
      }
      updateStats();
      return;
    }

    // Handle Tab and Enter keys
    const typedKey = e.key === 'Tab' ? '\t' : e.key === 'Enter' ? '\n' : e.key;
    const expectedChar = snippet[currentIndex];

    // Don't go beyond the snippet
    if (currentIndex >= snippet.length) return;

    totalKeystrokesRef.current++;

    const isCorrect = typedKey === expectedChar;

    if (isCorrect) {
      correctCharsRef.current++;
      sound.playKeyPress();
    } else {
      errorIndicesRef.current.add(currentIndex);
      sound.playError();
    }

    setCharStatuses(prev => {
      const next = [...prev];
      next[currentIndex] = isCorrect ? 'correct' : 'incorrect';
      return next;
    });
    setTypedChars(prev => {
      const next = [...prev];
      next[currentIndex] = typedKey;
      return next;
    });

    const newIndex = currentIndex + 1;
    setCurrentIndex(newIndex);

    // Check for completion
    if (newIndex === snippet.length) {
      endTimeRef.current = performance.now();
      setIsFinished(true);
      sound.playVictory();
    }

    updateStats();
  }, [snippet, currentIndex, isStarted, isFinished, charStatuses, updateStats]);

  const reset = useCallback((newSnippet?: string) => {
    const text = newSnippet ?? snippet;
    setSnippet(text);
    setCurrentIndex(0);
    setCharStatuses(new Array(text.length).fill('untyped'));
    setTypedChars(new Array(text.length).fill(null));
    setIsStarted(false);
    setIsFinished(false);
    correctCharsRef.current = 0;
    totalKeystrokesRef.current = 0;
    errorIndicesRef.current = new Set();
    startTimeRef.current = null;
    endTimeRef.current = null;
    setStats(computeStats(null, null, 0, 0, new Set()));
  }, [snippet]);

  return {
    snippet,
    currentIndex,
    charStatuses,
    typedChars,
    isStarted,
    isFinished,
    stats,
    handleKeyDown,
    reset,
  };
}
