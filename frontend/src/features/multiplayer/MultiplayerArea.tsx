import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../../services/api';
import { getCableConsumer } from '../../services/cable';
import type { Subscription } from '@rails/actioncable';
import { CodeDisplay } from '../typing/CodeDisplay';
import { useTypingEngine } from '../typing/useTypingEngine';
import styles from '../typing/TypingArea.module.css'; // Reuse styles for now
import multiplayerStyles from './MultiplayerArea.module.css';
import { RaceTrack, type TrackPlayer } from '../../components/RaceTrack';
import { ResultsScreen } from '../typing/ResultsScreen';

type Player = {
  id: string;
  user_id: string;
  username: string;
  is_host: boolean;
  current_position: number;
  wpm: number;
  finished_at: string | null;
};

type RaceState = {
  room_code: string;
  status: 'waiting' | 'countdown' | 'in_progress' | 'finished';
  snippet: any;
  host: { id: string, username: string };
  players: Player[];
  started_at?: string;
};

export function MultiplayerArea({ onExit }: { onExit: () => void }) {
  const [view, setView] = useState<'lobby' | 'waiting' | 'race'>('lobby');
  const [joinCode, setJoinCode] = useState('');
  const [raceState, setRaceState] = useState<RaceState | null>(null);
  const [error, setError] = useState('');
  
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [username, setUsername] = useState<string>('');
  const [difficulty, setDifficulty] = useState<number>(0);
  const [language, setLanguage] = useState<string>('');
  const subscriptionRef = useRef<Subscription | null>(null);

  // Initialize and get current user info
  useEffect(() => {
    api.getCurrentUser().then(user => {
      setCurrentUserId(user.id);
      setUsername(user.username);
    }).catch(err => console.error("Failed to fetch user:", err));
  }, []);

  const handleCreateRoom = async () => {
    try {
      setError('');
      if (!username.trim()) throw new Error("Name cannot be empty");
      await api.updateProfile(username.trim());

      const race = await api.createRace(difficulty || undefined, language || undefined);
      setRaceState({
        room_code: race.room_code,
        status: race.status,
        snippet: race.snippet,
        host: race.host,
        players: race.race_participants.map((p: any) => ({
          ...p,
          username: p.user.username,
          user_id: p.user.id
        }))
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
      if (!username.trim()) throw new Error("Name cannot be empty");
      await api.updateProfile(username.trim());

      const race = await api.joinRace(joinCode.trim());
      setRaceState({
        room_code: race.room_code,
        status: race.status,
        snippet: race.snippet,
        host: race.host,
        players: race.race_participants.map((p: any) => ({
          ...p,
          username: p.user.username,
          user_id: p.user.id
        }))
      });
      setView('waiting');
      setupSubscription(race.room_code);
    } catch (err: any) {
      setError(err.message || 'Failed to join room');
    }
  };

  const setupSubscription = async (roomCode: string) => {
    const consumer = await getCableConsumer();
    
    subscriptionRef.current = consumer.subscriptions.create(
      { channel: 'RaceChannel', room_code: roomCode },
      {
        received(data) {
          console.log("WS Data:", data);
          if (data.action === 'player_joined') {
            setRaceState(prev => {
              if (!prev) return prev;
              const exists = prev.players.find(p => p.user_id === data.participant.user_id);
              if (exists) return prev;
              return { ...prev, players: [...prev.players, data.participant] };
            });
          } else if (data.action === 'player_left') {
            setRaceState(prev => {
              if (!prev) return prev;
              return { ...prev, players: prev.players.filter(p => p.user_id !== data.user_id) };
            });
          } else if (data.action === 'race_starting') {
            setRaceState(prev => {
              if (!prev) return prev;
              return { ...prev, status: 'countdown', started_at: data.started_at };
            });
            setView('race');
          } else if (data.action === 'progress_updated') {
            setRaceState(prev => {
              if (!prev) return prev;
              return {
                ...prev,
                players: prev.players.map(p => 
                  p.user_id === data.user_id ? { ...p, current_position: data.current_position } : p
                )
              };
            });
          } else if (data.action === 'player_finished') {
            setRaceState(prev => {
              if (!prev) return prev;
              return {
                ...prev,
                players: prev.players.map(p => 
                  p.user_id === data.user_id ? { ...p, wpm: data.wpm, accuracy: data.accuracy, finished_at: new Date().toISOString() } : p
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

  // Cleanup subscription on unmount
  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
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
        <div className={multiplayerStyles.roomCodeBox}>
          <h3>Room Code</h3>
          <div className={multiplayerStyles.roomCode}>{raceState.room_code}</div>
          <p>Share this code with your friends to race!</p>
        </div>
        
        <div className={multiplayerStyles.playerList}>
          <h3>Players ({raceState.players.length})</h3>
          <ul>
            {raceState.players.map(p => (
              <li key={p.id}>
                {p.username} {p.user_id === raceState.host.id ? '(Host)' : ''}
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
    return (
      <LiveRace 
        raceState={raceState} 
        subscription={subscriptionRef.current} 
        currentUserId={currentUserId}
        onExit={onExit}
      />
    );
  }

  return null;
}

// Sub-component for the actual live race
function LiveRace({ 
  raceState, 
  subscription, 
  currentUserId,
  onExit 
}: { 
  raceState: RaceState, 
  subscription: Subscription | null, 
  currentUserId: string | null,
  onExit: () => void 
}) {
  const engine = useTypingEngine(raceState.snippet.body);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  const [countdown, setCountdown] = useState<number | null>(null);
  const [canType, setCanType] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Sync countdown with server time
  useEffect(() => {
    if (!raceState.started_at) return;
    
    const targetTime = new Date(raceState.started_at).getTime();
    
    const tick = () => {
      const now = new Date().getTime();
      const diff = targetTime - now;
      
      if (diff <= 0) {
        setCountdown(0);
        setCanType(true);
        inputRef.current?.focus();
      } else {
        setCountdown(Math.ceil(diff / 1000));
        requestAnimationFrame(tick);
      }
    };
    
    tick();
  }, [raceState.started_at]);

  // Throttle WS updates for progress
  const lastUpdateRef = useRef(0);
  useEffect(() => {
    const now = Date.now();
    // Only send if typing started and throttle to 200ms
    if (canType && now - lastUpdateRef.current > 200) {
      subscription?.perform('update_progress', { current_position: engine.currentIndex });
      lastUpdateRef.current = now;
    }
  }, [engine.currentIndex, canType, subscription]);

  // Finish race
  useEffect(() => {
    if (engine.isFinished) {
      subscription?.perform('finish_race', {
        total_keystrokes: engine.stats.totalKeystrokes,
        correct_chars: engine.stats.correctChars,
        error_count: engine.stats.errorCount,
        time_taken_seconds: engine.stats.elapsedSeconds
      });
    }
  }, [engine.isFinished]); // Intentionally omitting other deps to only run once on finish

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

  const carColors = ['#38bdf8', '#fbbf24', '#f87171', '#34d399', '#a78bfa', '#f472b6'];

  const trackPlayers: TrackPlayer[] = raceState.players.map((p, index) => {
    const isMe = p.user_id === currentUserId;
    return {
      id: p.id,
      username: p.username,
      isCurrentUser: isMe,
      currentPosition: isMe ? engine.currentIndex : p.current_position,
      totalLength: raceState.snippet.char_count,
      wpm: isMe ? engine.stats.wpm : p.wpm,
      finishedAt: p.finished_at,
      color: carColors[index % carColors.length]
    };
  });

  return (
    <div className={styles.container}>
      {countdown !== null && countdown > 0 && (
        <div className={multiplayerStyles.countdownOverlay}>
          <h1>{countdown}</h1>
        </div>
      )}
      
      {/* Live Race Track */}
      <RaceTrack players={trackPlayers} />

      {engine.isFinished && (
        <ResultsScreen
          stats={engine.stats}
          snippetLength={raceState.snippet.char_count}
          language={raceState.snippet.language}
          onPlayAgain={onExit}
          actionLabel="Back to Lobby"
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
