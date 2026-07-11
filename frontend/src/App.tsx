import { useState, useEffect } from 'react';
import { TypingArea } from './features/typing/TypingArea';
import { MultiplayerArea } from './features/multiplayer/MultiplayerArea';
import styles from './App.module.css';

export default function App() {
  const [mode, setMode] = useState<'solo' | 'multiplayer' | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('theme') as 'dark' | 'light') || 'dark';
  });

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

  return (
    <div className={styles.appWrapper}>
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
          <div style={{ textAlign: 'center', marginTop: '10vh' }}>
            <h1 style={{ fontSize: '4rem', marginBottom: '1rem', background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', color: 'transparent' }}>
              Race the world.
            </h1>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginBottom: '3rem' }}>
              Test your typing speed with real code snippets.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
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
          Built for developers who type fast ⚡ {' '}
        </p>
      </footer>
    </div>
  );
}
