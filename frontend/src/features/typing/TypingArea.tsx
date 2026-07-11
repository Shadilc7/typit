import { useRef, useEffect, useCallback, useState } from 'react';
import { useTypingEngine } from './useTypingEngine';
import { CodeDisplay } from './CodeDisplay';
import { StatsPanel } from './StatsPanel';
import { ResultsScreen } from './ResultsScreen';
import { api } from '../../services/api';
import { RaceTrack, type TrackPlayer } from '../../components/RaceTrack';
// We still import the Snippet type, but might need to adjust it slightly if it differs.
export type Snippet = {
  id?: string;
  title: string;
  language: string;
  difficulty: number;
  body: string;
  char_count?: number;
};
import styles from './TypingArea.module.css';

/**
 * Main typing game component.
 * Composes the code display, hidden input capture, stats panel,
 * and results screen into a complete typing experience.
 */
export function TypingArea() {
  const [snippet, setSnippet] = useState<Snippet | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const engine = useTypingEngine(snippet?.body || '');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Fetch initial snippet
  useEffect(() => {
    fetchNewSnippet();
  }, []);

  const fetchNewSnippet = async (lang?: string) => {
    setLoading(true);
    try {
      const newSnippet = await api.getRandomSnippet(lang);
      setSnippet(newSnippet);
      engine.reset(newSnippet.body);
    } catch (error) {
      console.error("Failed to load snippet:", error);
    } finally {
      setLoading(false);
    }
  };

  // Save result when finished
  useEffect(() => {
    if (engine.isFinished && snippet?.id) {
      api.saveResult({
        snippet_id: snippet.id,
        raw_wpm: engine.stats.wpm,
        total_keystrokes: engine.stats.totalKeystrokes,
        correct_chars: engine.stats.correctChars,
        error_count: engine.stats.errorCount,
        time_taken_seconds: engine.stats.elapsedSeconds
      }).catch(err => console.error("Failed to save result:", err));
    }
  }, [engine.isFinished, snippet, engine.stats]);

  // Focus the hidden input on mount and when snippet changes
  useEffect(() => {
    if (!loading) {
      inputRef.current?.focus();
    }
  }, [snippet, loading]);

  // Refocus input when clicking anywhere in the typing area
  const handleContainerClick = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  // Handle keyboard events
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Prevent default for most keys to avoid textarea behavior
    if (e.key !== 'F5' && e.key !== 'F12' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
    }
    engine.handleKeyDown(e);
  }, [engine]);

  // Prevent paste
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
  }, []);

  // Play again handler
  const handlePlayAgain = useCallback(() => {
    fetchNewSnippet(selectedLanguage || undefined).then(() => {
      // Refocus after state update
      setTimeout(() => inputRef.current?.focus(), 50);
    });
  }, [selectedLanguage]);

  // Language filter
  const handleLanguageChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const lang = e.target.value;
    setSelectedLanguage(lang);
    fetchNewSnippet(lang || undefined).then(() => {
      setTimeout(() => inputRef.current?.focus(), 50);
    });
  }, []);

  const [isFocused, setIsFocused] = useState(false);

  if (loading || !snippet) {
    return <div className={styles.container}><div style={{textAlign: 'center', padding: '2rem'}}>Loading snippet...</div></div>;
  }

  const trackPlayer: TrackPlayer = {
    id: 'solo-player',
    username: 'Guest',
    isCurrentUser: true,
    currentPosition: engine.currentIndex,
    totalLength: snippet.body.length,
    wpm: engine.stats.wpm,
    finishedAt: engine.isFinished ? new Date().toISOString() : null,
    color: '#38bdf8' // Cyberpunk sky blue color
  };

  return (
    <div className={styles.container} id="typing-area">
      {/* Header with snippet info and language filter */}
      <div className={styles.header}>
        <div className={styles.snippetInfo}>
          <h2 className={styles.snippetTitle}>{snippet.title}</h2>
          <div className={styles.snippetMeta}>
            <span className={styles.languageBadge}>{snippet.language}</span>
            <span className={styles.difficulty}>
              {'★'.repeat(snippet.difficulty)}{'☆'.repeat(5 - snippet.difficulty)}
            </span>
            <span className={styles.charCount}>{snippet.body.length} chars</span>
          </div>
        </div>

        <div className={styles.controls}>
          <select
            className={styles.languageSelect}
            value={selectedLanguage}
            onChange={handleLanguageChange}
            id="language-filter"
          >
            <option value="">All Languages</option>
            <option value="text">Normal Text</option>
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
            <option value="python">Python</option>
            <option value="ruby">Ruby</option>
          </select>

          <button
            className={styles.newSnippetBtn}
            onClick={handlePlayAgain}
            id="new-snippet-button"
            title="Get a new random snippet"
          >
            ↻
          </button>
        </div>
      </div>

      {/* Live Race Track */}
      <RaceTrack players={[trackPlayer]} />

      {/* Stats panel */}
      <StatsPanel
        wpm={engine.stats.wpm}
        accuracy={engine.stats.accuracy}
        elapsedSeconds={engine.stats.elapsedSeconds}
        errorCount={engine.stats.errorCount}
        correctChars={engine.currentIndex}
        totalChars={snippet.body.length}
        isStarted={engine.isStarted}
        isFinished={engine.isFinished}
      />

      {/* Code display (click to focus) */}
      <div
        className={`${styles.codeContainer} ${!isFocused && !engine.isFinished ? styles.unfocused : ''}`}
        onClick={handleContainerClick}
      >
        <CodeDisplay
          snippet={engine.snippet}
          charStatuses={engine.charStatuses}
          typedChars={engine.typedChars}
          currentIndex={engine.currentIndex}
          isFinished={engine.isFinished}
        />

        {/* Focus prompt */}
        {!isFocused && !engine.isFinished && (
          <div className={styles.focusPrompt}>
            <span>Click here or press any key to start typing</span>
          </div>
        )}

        {/* Hidden textarea for capturing keyboard input */}
        <textarea
          ref={inputRef}
          className={styles.hiddenInput}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          autoFocus
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          aria-label="Type the code snippet shown above"
          id="typing-input"
        />
      </div>

      {/* Instructions */}
      {!engine.isStarted && (
        <div className={styles.instructions}>
          <p>Start typing to begin the race. Match the code exactly — including spaces and newlines.</p>
          <p className={styles.shortcutHint}>
            <kbd>Backspace</kbd> to fix errors • <kbd>Enter</kbd> for newlines
          </p>
        </div>
      )}

      {/* Results overlay */}
      {engine.isFinished && (
        <ResultsScreen
          stats={engine.stats}
          snippetLength={snippet.body.length}
          language={snippet.language}
          onPlayAgain={handlePlayAgain}
        />
      )}
    </div>
  );
}


