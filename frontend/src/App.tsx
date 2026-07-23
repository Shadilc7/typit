import { useState, useEffect } from 'react';
import { TypingArea } from './features/typing/TypingArea';
import { MultiplayerArea } from './features/multiplayer/MultiplayerArea';
import { sound } from './services/sound';
import styles from './App.module.css';

export default function App() {
  const [mode, setMode] = useState<'solo' | 'multiplayer' | null>(null);
  const [isMuted, setIsMuted] = useState(() => sound.getMuted());
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('theme') as 'dark' | 'light') || 'dark';
  });

  // Check URL query parameters for direct room joins
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room') || urlParams.get('join');
    if (roomParam) {
      setMode('multiplayer');
    }
  }, []);

  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const toggleSound = () => {
    setIsMuted(sound.toggleMute());
  };

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.logo} onClick={() => setMode(null)} style={{cursor: 'pointer'}}>
          <span className={styles.logoIcon}>⚡</span> Typit
        </div>
        <nav className={styles.nav}>
          <button 
            className={`${styles.navBtn} ${mode === 'solo' ? styles.activeNav : ''}`} 
            onClick={() => setMode('solo')}
          >
            SOLO PRACTICE
          </button>
          <button 
            className={`${styles.navBtn} ${mode === 'multiplayer' ? styles.activeNav : ''}`} 
            onClick={() => setMode('multiplayer')}
          >
            MULTIPLAYER
          </button>
          <button 
            onClick={toggleSound} 
            className={styles.themeToggle}
            title={isMuted ? "Unmute Sound Effects" : "Mute Sound Effects"}
            style={{ marginRight: '0.25rem' }}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
          <button 
            onClick={toggleTheme} 
            className={styles.themeToggle}
            title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </nav>
      </header>

      <main className={styles.main}>
        {mode === null && (
          <div className={styles.heroContainer}>
            <h1 className={styles.heroTitle}>
              Race the world.
            </h1>
            <p className={styles.heroSubtitle}>
              Test your typing speed with real code snippets.
            </p>
            <div className={styles.heroActions}>
              <button 
                onClick={() => setMode('solo')}
                className={styles.ctaBtnSolo}
              >
                Solo Practice
              </button>
              <button 
                onClick={() => setMode('multiplayer')}
                className={styles.ctaBtnMulti}
              >
                Multiplayer Race
              </button>
            </div>
          </div>
        )}
        {mode === 'solo' && <TypingArea />}
        {mode === 'multiplayer' && <MultiplayerArea onExit={() => setMode(null)} />}
      </main>

      <footer className={styles.footer}>
        <p>
          Built for anyone who types fast ⚡
        </p>
      </footer>
    </div>
  );
}
