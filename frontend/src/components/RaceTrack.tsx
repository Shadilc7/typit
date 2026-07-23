import { RunnerSvg } from './RunnerSvg';
import styles from './RaceTrack.module.css';

export interface TrackPlayer {
  id: string;
  username: string;
  isCurrentUser: boolean;
  currentPosition: number;
  totalLength: number;
  wpm: number;
  finishedAt: string | null;
  left?: boolean;
  color: string;
}

interface RaceTrackProps {
  players: TrackPlayer[];
}

export function RaceTrack({ players }: RaceTrackProps) {
  // Sort players by position descending to calculate dynamic live ranks
  const sortedPlayers = [...players].sort((a, b) => {
    if (a.finishedAt && b.finishedAt) {
      return new Date(a.finishedAt).getTime() - new Date(b.finishedAt).getTime();
    }
    if (a.finishedAt) return -1;
    if (b.finishedAt) return 1;
    if (a.left && !b.left) return 1;
    if (!a.left && b.left) return -1;
    return b.currentPosition - a.currentPosition;
  });

  const leader = sortedPlayers.find(p => !p.left) || sortedPlayers[0];

  const getRankBadge = (playerId: string) => {
    const rankIndex = sortedPlayers.findIndex(p => p.id === playerId);
    if (rankIndex === 0) return { label: '1st', icon: '🥇', class: styles.rankGold };
    if (rankIndex === 1) return { label: '2nd', icon: '🥈', class: styles.rankSilver };
    if (rankIndex === 2) return { label: '3rd', icon: '🥉', class: styles.rankBronze };
    return { label: `${rankIndex + 1}th`, icon: '', class: styles.rankDefault };
  };

  return (
    <div className={styles.raceTracksContainer}>
      {/* Header & Live Scoreboard Banner */}
      <div className={styles.trackHeader}>
        <div className={styles.trackTitle}>
          <span className={styles.flagIcon}>🏁</span>
          <span>LIVE RACE TRACK</span>
        </div>

        {/* Live Leaderboard Chip */}
        {leader && (
          <div className={styles.leaderBanner}>
            <span className={styles.leaderFire}>🔥</span>
            <span className={styles.leaderText}>
              Leader: <strong>{leader.username}</strong> ({Math.round(leader.wpm)} WPM)
            </span>
          </div>
        )}

        <div className={styles.playerCount}>
          {players.length} {players.length === 1 ? 'Racer' : 'Racers'}
        </div>
      </div>

      <div className={styles.lanesList}>
        {players.map((player) => {
          const rank = getRankBadge(player.id);
          const progressPercent = player.totalLength > 0 
            ? Math.min(100, Math.max(0, (player.currentPosition / player.totalLength) * 100))
            : 0;
          
          // Hardware-accelerated 60fps positioning
          const positionStyle = {
            left: `${progressPercent}%`,
            transform: `translate3d(-${(progressPercent / 100) * 44}px, 0, 0)`
          };

          const isMoving = player.currentPosition > 0 && !player.finishedAt && !player.left;

          return (
            <div 
              key={player.id} 
              className={`
                ${styles.trackRow} 
                ${player.isCurrentUser ? styles.currentUserRow : ''}
                ${player.left ? styles.leftRow : ''}
              `}
            >
              {/* Left Column: Rank & Player Info */}
              <div className={styles.playerInfo}>
                <span className={`${styles.rankBadge} ${rank.class}`}>
                  {rank.icon && <span className={styles.rankIcon}>{rank.icon}</span>}
                  {rank.label}
                </span>
                <span className={styles.username} title={player.username}>
                  {player.username}
                  {player.isCurrentUser && <span className={styles.youBadge}> (you)</span>}
                </span>
              </div>

              {/* Middle Column: The Track Lane */}
              <div className={styles.trackArea}>
                {/* Track Surface & Line */}
                <div className={styles.dashedLine} />
                
                {/* Finish Line Indicator */}
                <div className={styles.finishLine} title="Finish Line">
                  🏁
                </div>

                {/* Moving HD Runner Avatar */}
                <div className={styles.carWrapper} style={positionStyle}>
                  <RunnerSvg 
                    color={player.left ? '#64748b' : player.color} 
                    width={44} 
                    height={46} 
                    isMoving={isMoving}
                    wpm={player.wpm}
                    isFinished={!!player.finishedAt}
                  />
                </div>
              </div>

              {/* Right Column: Speed & Status */}
              <div className={styles.wpmInfo}>
                {player.left ? (
                  <span className={styles.leftBadge}>LEFT RACE</span>
                ) : player.finishedAt ? (
                  <span className={styles.finishedBadge}>FINISHED</span>
                ) : (
                  <span className={styles.wpmValue}>
                    {Math.round(player.wpm || 0)} <span className={styles.wpmUnit}>WPM</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
