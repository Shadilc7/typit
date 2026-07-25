import { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { getCableConsumer } from '../../services/cable';
import type { Subscription } from '@rails/actioncable';
import { CodeDisplay } from '../typing/CodeDisplay';
import { useTypingEngine } from '../typing/useTypingEngine';
import styles from '../typing/TypingArea.module.css';
import multiplayerStyles from './MultiplayerArea.module.css';
import { RaceTrack } from '../../components/RaceTrack';
import { MultiplayerScoreboard } from './MultiplayerScoreboard';
import { sound } from '../../services/sound';

type Player = {
  id: string;
  user_id: string;
  username: string;
  is_host: boolean;
  current_position: number;
  wpm: number;
  accuracy?: number;
  finished_at: string | null;
  left?: boolean;
};

type RaceState = {
  room_code: string;
  status: 'waiting' | 'countdown' | 'in_progress' | 'finished';
  snippet: any;
  host: { id: string; username: string };
  players: Player[];
  started_at?: string;
};

const CAR_COLORS = [
  '#38bdf8', // Cyan
  '#fbbf24', // Amber / Gold
  '#f87171', // Red / Rose
  '#34d399', // Emerald
  '#a78bfa', // Purple
  '#f472b6', // Pink
  '#fb923c', // Orange
  '#60a5fa'  // Blue
];

/**
 * Standardize participant object structure across REST API and WebSocket events
 */
function normalizeParticipant(p: any, hostId?: string): Player {
  const userId = p.user_id || (p.user && p.user.id);
  const username = p.username || (p.user && p.user.username) || 'Player';
  const isHost = p.is_host !== undefined ? p.is_host : (hostId ? userId === hostId : false);

  return {
    id: p.id || userId,
    user_id: userId,
    username,
    is_host: isHost,
    current_position: Number(p.current_position) || 0,
    wpm: Number(p.wpm) || 0,
    finished_at: p.finished_at || null
  };
}

export function MultiplayerArea({ onExit }: { onExit: () => void }) {
  const [view, setView] = useState<'lobby' | 'waiting' | 'race'>('lobby');
  const [joinCode, setJoinCode] = useState('');
  const [raceState, setRaceState] = useState<RaceState | null>(null);
  const [error, setError] = useState('');
  
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [username, setUsername] = useState<string>('');
  const [difficulty, setDifficulty] = useState<number>(0);
  const [language, setLanguage] = useState<string>('');
  const [notification, setNotification] = useState<string | null>(null);
  const subscriptionRef = useRef<Subscription | null>(null);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Initialize and get current user info
  useEffect(() => {
    api.getCurrentUser().then(user => {
      setCurrentUserId(user.id);
      setUsername(user.username);
    }).catch(err => console.error("Failed to fetch user profile:", err));
  }, []);

  const handleCreateRoom = async () => {
    try {
      setError('');
      if (!username.trim()) throw new Error("Please enter your name");
      await api.updateProfile(username.trim());

      const race = await api.createRace(difficulty || undefined, language || undefined);
      const hostId = race.host.id;
      const normalizedPlayers = race.race_participants.map((p: any) => normalizeParticipant(p, hostId));

      setRaceState({
        room_code: race.room_code,
        status: race.status,
        snippet: race.snippet,
        host: race.host,
        players: normalizedPlayers
      });
      setView('waiting');
      setupSubscription(race.room_code);
    } catch (err: any) {
      setError(err.message || 'Failed to create room');
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    
    try {
      setError('');
      if (!username.trim()) throw new Error("Please enter your name");
      await api.updateProfile(username.trim());

      const race = await api.joinRace(joinCode.trim());
      const hostId = race.host.id;
      const normalizedPlayers = race.race_participants.map((p: any) => normalizeParticipant(p, hostId));

      setRaceState({
        room_code: race.room_code,
        status: race.status,
        snippet: race.snippet,
        host: race.host,
        players: normalizedPlayers
      });
      setView('waiting');
      setupSubscription(race.room_code);
    } catch (err: any) {
      setError(err.message || 'Failed to join room');
    }
  };

  const setupSubscription = async (roomCode: string) => {
    const consumer = await getCableConsumer(true);
    
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
    }

    subscriptionRef.current = consumer.subscriptions.create(
      { channel: 'RaceChannel', room_code: roomCode },
      {
        received(data: any) {
          if (data.action === 'player_joined') {
            setRaceState(prev => {
              if (!prev) return prev;
              const newPlayer = normalizeParticipant(data.participant, prev.host.id);
              const exists = prev.players.some(p => p.user_id === newPlayer.user_id);
              if (exists) {
                return {
                  ...prev,
                  players: prev.players.map(p => p.user_id === newPlayer.user_id ? { ...p, ...newPlayer } : p)
                };
              }
              return { ...prev, players: [...prev.players, newPlayer] };
            });
          } else if (data.action === 'player_left') {
            setRaceState(prev => {
              if (!prev) return prev;
              if (prev.status === 'waiting') {
                return { ...prev, players: prev.players.filter(p => p.user_id !== data.user_id) };
              }
              return {
                ...prev,
                players: prev.players.map(p => 
                  p.user_id === data.user_id ? { ...p, left: true } : p
                )
              };
            });
            if (data.username) {
              setNotification(`⚠️ ${data.username} left the race`);
            }
          } else if (data.action === 'race_starting') {
            setRaceState(prev => {
              if (!prev) return prev;
              return { ...prev, status: 'countdown', started_at: data.started_at };
            });
            setView('race');
          } else if (data.action === 'race_restarted') {
            setRaceState(prev => {
              if (!prev) return prev;
              return {
                ...prev,
                status: 'countdown',
                started_at: data.started_at,
                snippet: data.snippet || prev.snippet,
                players: prev.players.map(p => ({
                  ...p,
                  current_position: 0,
                  wpm: 0,
                  finished_at: null,
                  left: false
                }))
              };
            });
            setView('race');
            setNotification('🔄 Rematch starting!');
          } else if (data.action === 'progress_updated') {
            setRaceState(prev => {
              if (!prev) return prev;
              return {
                ...prev,
                players: prev.players.map(p => 
                  p.user_id === data.user_id 
                    ? { 
                        ...p, 
                        current_position: Number(data.current_position),
                        wpm: data.wpm !== undefined ? Number(data.wpm) : p.wpm,
                        accuracy: data.accuracy !== undefined ? Number(data.accuracy) : p.accuracy
                      } 
                    : p
                )
              };
            });
          } else if (data.action === 'player_finished') {
            setRaceState(prev => {
              if (!prev) return prev;
              return {
                ...prev,
                players: prev.players.map(p => 
                  p.user_id === data.user_id 
                    ? { 
                        ...p, 
                        current_position: data.current_position || prev.snippet.char_count,
                        wpm: Number(data.wpm), 
                        accuracy: data.accuracy !== undefined ? Number(data.accuracy) : p.accuracy,
                        finished_at: data.finished_at || new Date().toISOString() 
                      } 
                    : p
                )
              };
            });
          }
        }
      }
    );
  };

  const handleStartRace = () => {
    subscriptionRef.current?.perform('start_race');
  };

  const handleRematch = () => {
    subscriptionRef.current?.perform('rematch');
  };

  const [copied, setCopied] = useState(false);

  const handleCopyInviteLink = () => {
    if (!raceState) return;
    const url = `${window.location.origin}${window.location.pathname}?room=${raceState.room_code}`;
    
    const showSuccess = () => {
      setCopied(true);
      setNotification('📋 Room invite link copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    };

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(url).then(showSuccess).catch(() => fallbackCopy(url, showSuccess));
    } else {
      fallbackCopy(url, showSuccess);
    }
  };

  const fallbackCopy = (text: string, onSuccess: () => void) => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      textArea.style.top = '-9999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      onSuccess();
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  // Cleanup subscription on unmount
  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, []);

  if (view === 'lobby') {
    return (
      <div className={multiplayerStyles.lobbyContainer}>
        <h2>Multiplayer Racing</h2>
        {error && <div className={multiplayerStyles.error}>{error}</div>}
        
        <div className={multiplayerStyles.formGroup} style={{ alignSelf: 'center', minWidth: '300px', marginBottom: '1rem' }}>
          <label>Your Name</label>
          <input 
            type="text" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={multiplayerStyles.input}
            maxLength={20}
          />
        </div>

        <div className={multiplayerStyles.lobbyActions}>
          <div className={multiplayerStyles.createSection}>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div className={multiplayerStyles.formGroup} style={{ flex: 1 }}>
                <label>Mode / Language</label>
                <select 
                  value={language} 
                  onChange={(e) => setLanguage(e.target.value)}
                  className={multiplayerStyles.select}
                >
                  <option value="">Any Category</option>
                  <option value="text">Normal Text (Quotes & Prose)</option>
                  <option value="javascript">JavaScript</option>
                  <option value="typescript">TypeScript</option>
                  <option value="python">Python</option>
                  <option value="ruby">Ruby</option>
                </select>
              </div>
              <div className={multiplayerStyles.formGroup} style={{ flex: 1 }}>
                <label>Difficulty</label>
                <select 
                  value={difficulty} 
                  onChange={(e) => setDifficulty(Number(e.target.value))}
                  className={multiplayerStyles.select}
                >
                  <option value={0}>Any Difficulty</option>
                  <option value={1}>★ Beginner</option>
                  <option value={2}>★★ Easy</option>
                  <option value={3}>★★★ Medium</option>
                  <option value={4}>★★★★ Hard</option>
                  <option value={5}>★★★★★ Master</option>
                </select>
              </div>
            </div>
            <button className={multiplayerStyles.primaryBtn} onClick={handleCreateRoom} style={{ marginTop: 'auto', width: '100%' }}>
              Create Private Room
            </button>
          </div>
          
          <div className={multiplayerStyles.divider}>OR</div>
          
          <form onSubmit={handleJoinRoom} className={multiplayerStyles.joinForm}>
            <div className={multiplayerStyles.formGroup}>
              <label>Room Code</label>
              <input 
                type="text" 
                placeholder="Enter 6-char Code" 
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                maxLength={6}
                className={multiplayerStyles.input}
              />
            </div>
            <button type="submit" className={multiplayerStyles.secondaryBtn} style={{ marginTop: 'auto' }}>Join Room</button>
          </form>
        </div>
        <button onClick={onExit} className={multiplayerStyles.textBtn}>Back to Main Menu</button>
      </div>
    );
  }

  if (view === 'waiting' && raceState) {
    const isHost = currentUserId === raceState.host.id;

    return (
      <div className={multiplayerStyles.waitingContainer}>
        {notification && (
          <div className={multiplayerStyles.toastNotification}>
            {notification}
          </div>
        )}
        <div className={multiplayerStyles.roomCodeBox}>
          <h3>Room Code</h3>
          <div className={multiplayerStyles.roomCode}>{raceState.room_code}</div>
          <button 
            onClick={handleCopyInviteLink} 
            className={multiplayerStyles.secondaryBtn} 
            style={{ 
              marginTop: '0.75rem', 
              fontSize: 'var(--text-xs)', 
              padding: '0.5rem 1rem',
              backgroundColor: copied ? 'rgba(52, 211, 153, 0.2)' : undefined,
              borderColor: copied ? '#34d399' : undefined,
              color: copied ? '#34d399' : undefined,
              transition: 'all 0.2s ease'
            }}
          >
            {copied ? '✓ Copied to Clipboard!' : '📋 Copy Invite Link'}
          </button>
        </div>
        
        <div className={multiplayerStyles.playerList}>
          <h3>Players Connected ({raceState.players.length})</h3>
          <ul>
            {raceState.players.map(p => (
              <li key={p.id || p.user_id}>
                <span>{p.username}</span> {p.user_id === raceState.host.id ? <strong style={{ color: 'var(--color-accent-primary-light)' }}>(Host)</strong> : ''}
              </li>
            ))}
          </ul>
        </div>
        
        <div className={multiplayerStyles.actions}>
          {isHost ? (
            <button 
              className={multiplayerStyles.primaryBtn} 
              onClick={handleStartRace}
            >
              Start Race
            </button>
          ) : (
            <div className={multiplayerStyles.waitingStatus}>Waiting for host to start the race...</div>
          )}
          <button onClick={onExit} className={multiplayerStyles.textBtn}>Leave Room</button>
        </div>
      </div>
    );
  }

  if (view === 'race' && raceState) {
    const isHost = currentUserId === raceState.host.id;
    return (
      <LiveRace 
        raceState={raceState} 
        subscription={subscriptionRef.current} 
        currentUserId={currentUserId}
        notification={notification}
        isHost={isHost}
        onRematch={handleRematch}
        onExit={onExit}
      />
    );
  }

  return null;
}

// Sub-component for the live race view
function LiveRace({ 
  raceState, 
  subscription, 
  currentUserId,
  notification,
  isHost,
  onRematch,
  onExit 
}: { 
  raceState: RaceState; 
  subscription: Subscription | null; 
  currentUserId: string | null;
  notification: string | null;
  isHost?: boolean;
  onRematch?: () => void;
  onExit: () => void; 
}) {
  const engine = useTypingEngine(raceState.snippet.body);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  const [countdown, setCountdown] = useState<number | null>(null);
  const [canType, setCanType] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Reset typing engine on rematch or countdown start
  useEffect(() => {
    if (raceState.status === 'countdown') {
      engine.reset(raceState.snippet.body);
      setCanType(false);
    }
  }, [raceState.snippet.body, raceState.status]);

  // Sync countdown with server timestamp
  useEffect(() => {
    if (!raceState.started_at) return;
    
    const targetTime = new Date(raceState.started_at).getTime();
    
    const tick = () => {
      const now = Date.now();
      const diff = targetTime - now;
      
      if (diff <= 0) {
        setCountdown(0);
        setCanType(true);
        sound.playBeep(true);
        inputRef.current?.focus();
      } else {
        const secs = Math.ceil(diff / 1000);
        setCountdown(prev => {
          if (prev !== secs && secs <= 5) {
            sound.playBeep(false);
          }
          return secs;
        });
        requestAnimationFrame(tick);
      }
    };
    
    tick();
  }, [raceState.started_at]);

  // Robust throttled + trailing edge progress update to ActionCable
  const lastUpdateMsRef = useRef<number>(0);
  const pendingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!canType || engine.isFinished) return;

    const sendProgress = () => {
      subscription?.perform('update_progress', { 
        current_position: engine.currentIndex,
        wpm: engine.stats.wpm,
        accuracy: engine.stats.accuracy
      });
      lastUpdateMsRef.current = Date.now();
    };

    const now = Date.now();
    const timeSinceLast = now - lastUpdateMsRef.current;

    if (pendingTimerRef.current) {
      clearTimeout(pendingTimerRef.current);
      pendingTimerRef.current = null;
    }

    if (timeSinceLast >= 150) {
      sendProgress();
    } else {
      pendingTimerRef.current = setTimeout(() => {
        sendProgress();
        pendingTimerRef.current = null;
      }, 150 - timeSinceLast);
    }

    return () => {
      if (pendingTimerRef.current) {
        clearTimeout(pendingTimerRef.current);
        pendingTimerRef.current = null;
      }
    };
  }, [engine.currentIndex, engine.stats.wpm, engine.stats.accuracy, canType, engine.isFinished, subscription]);

  // Handle final completion
  useEffect(() => {
    if (engine.isFinished) {
      subscription?.perform('finish_race', {
        total_keystrokes: engine.stats.totalKeystrokes,
        correct_chars: engine.stats.correctChars,
        error_count: engine.stats.errorCount,
        time_taken_seconds: engine.stats.elapsedSeconds
      });
    }
  }, [engine.isFinished, subscription, engine.stats]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!canType) {
      e.preventDefault();
      return;
    }
    if (e.key !== 'F5' && e.key !== 'F12' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
    }
    engine.handleKeyDown(e);
  };

  // Build tracking player list for RaceTrack and MultiplayerScoreboard components
  const trackPlayers = raceState.players.map((p, index) => {
    const isMe = p.user_id === currentUserId;
    return {
      id: p.id || p.user_id,
      user_id: p.user_id,
      username: p.username,
      isCurrentUser: isMe,
      currentPosition: isMe ? engine.currentIndex : p.current_position,
      totalLength: raceState.snippet.char_count,
      wpm: isMe ? engine.stats.wpm : p.wpm,
      accuracy: isMe ? engine.stats.accuracy : undefined,
      finishedAt: p.finished_at,
      left: p.left,
      color: CAR_COLORS[index % CAR_COLORS.length]
    };
  });

  return (
    <div className={styles.container}>
      {notification && (
        <div className={multiplayerStyles.toastNotification}>
          {notification}
        </div>
      )}

      {countdown !== null && countdown > 0 && (
        <div className={multiplayerStyles.countdownOverlay}>
          <h1>{countdown}</h1>
        </div>
      )}
      
      {/* Live Race Track displaying all tracking cars and live leader banner */}
      <RaceTrack players={trackPlayers} />

      {/* Final Multiplayer Scoreboard & Podium once player finishes */}
      {(engine.isFinished || raceState.status === 'finished') && (
        <MultiplayerScoreboard
          players={trackPlayers}
          totalLength={raceState.snippet.char_count}
          currentUserId={currentUserId}
          isHost={isHost}
          onRematch={onRematch}
          onExit={onExit}
        />
      )}

      <div 
        className={`${styles.codeContainer} ${!isFocused && !engine.isFinished && canType ? styles.unfocused : ''}`} 
        onClick={() => inputRef.current?.focus()}
      >
        <CodeDisplay
          snippet={engine.snippet}
          charStatuses={engine.charStatuses}
          typedChars={engine.typedChars}
          currentIndex={engine.currentIndex}
          isFinished={engine.isFinished}
        />

        {/* Focus prompt */}
        {!isFocused && !engine.isFinished && canType && (
          <div className={styles.focusPrompt}>
            <span>Click here or press any key to start typing</span>
          </div>
        )}
        
        <textarea
          ref={inputRef}
          className={styles.hiddenInput}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          onPaste={e => e.preventDefault()}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          disabled={!canType}
        />
      </div>
      
      <div style={{ marginTop: '1rem', textAlign: 'center' }}>
        <button onClick={onExit} className={multiplayerStyles.secondaryBtn}>Leave Race</button>
      </div>
    </div>
  );
}
