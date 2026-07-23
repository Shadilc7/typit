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
export type TargetBotPace = 'off' | 'beginner' | 'intermediate' | 'pro' | 'master';

const BOT_PACES: Record<TargetBotPace, { label: string; wpm: number; color: string; badge: string }> = {
  off: { label: '🤖 Target Bot: Off', wpm: 0, color: '#94a3b8', badge: '' },
  beginner: { label: '🟢 Beginner (30 WPM)', wpm: 30, color: '#34d399', badge: 'Beginner Bot' },
  intermediate: { label: '🔵 Intermediate (50 WPM)', wpm: 50, color: '#38bdf8', badge: 'Intermediate Bot' },
  pro: { label: '🟣 Pro Racer (70 WPM)', wpm: 70, color: '#a855f7', badge: 'Pro Bot' },
  master: { label: '🔥 Master Typist (100 WPM)', wpm: 100, color: '#f43f5e', badge: 'Master Bot' }
};

export function TypingArea() {
  const [snippet, setSnippet] = useState<Snippet | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Target Bot Pace state (default Off)
  const [targetBotPace, setTargetBotPace] = useState<TargetBotPace>(() => {
    if (typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function') {
      const saved = localStorage.getItem('typit_target_bot') as TargetBotPace;
      if (saved && BOT_PACES[saved]) return saved;
    }
    return 'off';
  });

  // Custom snippet modal state
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customText, setCustomText] = useState('');

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

  const handleStartCustomSnippet = () => {
    if (!customText.trim()) return;
    const customSnippet: Snippet = {
      title: 'Custom Snippet',
      language: 'custom',
      difficulty: 1,
      body: customText.trim(),
      char_count: customText.trim().length
    };
    setSnippet(customSnippet);
    engine.reset(customSnippet.body);
    setShowCustomModal(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleTargetBotChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pace = e.target.value as TargetBotPace;
    setTargetBotPace(pace);
    localStorage.setItem('typit_target_bot', pace);
    setTimeout(() => inputRef.current?.focus(), 50);
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

  // Prevent paste unless custom modal is open
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    if (!showCustomModal) {
      e.preventDefault();
    }
  }, [showCustomModal]);

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

  const trackPlayers: TrackPlayer[] = [
    {
      id: 'solo-player',
      username: 'You',
      isCurrentUser: true,
      currentPosition: engine.currentIndex,
      totalLength: snippet.body.length,
      wpm: engine.stats.wpm,
      finishedAt: engine.isFinished ? new Date().toISOString() : null,
      color: '#38bdf8' // Sky blue color
    }
  ];

  if (targetBotPace !== 'off' && BOT_PACES[targetBotPace]) {
    const botConfig = BOT_PACES[targetBotPace];
    const ghostCharsTyped = engine.isStarted 
      ? Math.min(snippet.body.length, Math.floor((engine.stats.elapsedSeconds / 60) * (botConfig.wpm * 5)))
      : 0;

    trackPlayers.push({
      id: 'bot-player',
      username: `${botConfig.badge} (${botConfig.wpm} WPM)`,
      isCurrentUser: false,
      currentPosition: ghostCharsTyped,
      totalLength: snippet.body.length,
      wpm: botConfig.wpm,
      finishedAt: ghostCharsTyped >= snippet.body.length ? new Date().toISOString() : null,
      color: botConfig.color
    });
  }

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
            value={targetBotPace}
            onChange={handleTargetBotChange}
            id="target-bot-select"
            style={{ fontWeight: targetBotPace !== 'off' ? '700' : 'normal' }}
          >
            {(Object.keys(BOT_PACES) as TargetBotPace[]).map(key => (
              <option key={key} value={key}>
                {BOT_PACES[key].label}
              </option>
            ))}
          </select>

          <button 
            className={styles.languageSelect} 
            style={{ cursor: 'pointer', paddingRight: '1rem', backgroundImage: 'none' }}
            onClick={() => setShowCustomModal(true)}
          >
            📝 Custom Text
          </button>

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

      {/* Live Race Track (Target Bot Optional) */}
      <RaceTrack players={trackPlayers} />

      {/* Custom Snippet Modal */}
      {showCustomModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Practice Custom Snippet</h3>
            <p>Paste or type any code snippet or text you want to practice below:</p>
            <textarea
              className={styles.customTextarea}
              rows={6}
              value={customText}
              onChange={e => setCustomText(e.target.value)}
              placeholder="Paste your custom code here..."
              autoFocus
            />
            <div className={styles.modalActions}>
              <button className={styles.primaryBtn} onClick={handleStartCustomSnippet}>
                Start Practice
              </button>
              <button className={styles.secondaryBtn} onClick={() => setShowCustomModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

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


