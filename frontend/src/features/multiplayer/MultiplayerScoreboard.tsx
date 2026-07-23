import styles from './MultiplayerScoreboard.module.css';

export interface ScoreboardPlayer {
  id: string;
  user_id: string;
  username: string;
  isCurrentUser: boolean;
  currentPosition: number;
  totalLength: number;
  wpm: number;
  accuracy?: number;
  finishedAt: string | null;
  left?: boolean;
  color: string;
}

interface MultiplayerScoreboardProps {
  players: ScoreboardPlayer[];
  totalLength: number;
  currentUserId: string | null;
  isHost?: boolean;
  onRematch?: () => void;
  onExit: () => void;
}

export function MultiplayerScoreboard({
  players,
  totalLength,
  currentUserId,
  isHost,
  onRematch,
  onExit
}: MultiplayerScoreboardProps) {
  // Sort players: finished players first by finishedAt time, then active, then left players
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

  const currentUser = players.find(p => p.user_id === currentUserId);
  const winner = sortedPlayers[0];
  const second = sortedPlayers[1];
  const third = sortedPlayers[2];

  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>
            {winner?.user_id === currentUserId ? '🏆 Victory! You Won The Race!' : '🏁 Race Final Standings'}
          </h2>
          <p className={styles.subtitle}>
            Multiplayer Coding Speed Race
          </p>
        </div>

        {/* Podium for Top 3 */}
        {sortedPlayers.length >= 1 && (
          <div className={styles.podiumContainer}>
            {/* 2nd Place */}
            {second ? (
              <div className={`${styles.podiumStep} ${styles.stepSilver}`}>
                <div className={styles.podiumMedal}>🥈</div>
                <div className={styles.podiumName}>{second.username}</div>
                <div className={styles.podiumWpm}>{Math.round(second.wpm)} WPM</div>
                <div className={styles.podiumBarSilver}>2ND</div>
              </div>
            ) : (
              <div className={`${styles.podiumStep} ${styles.stepEmpty}`} />
            )}

            {/* 1st Place (Winner) */}
            {winner && (
              <div className={`${styles.podiumStep} ${styles.stepGold}`}>
                <div className={styles.crown}>👑</div>
                <div className={styles.podiumMedal}>🥇</div>
                <div className={styles.podiumName}>{winner.username}</div>
                <div className={styles.podiumWpm}>{Math.round(winner.wpm)} WPM</div>
                <div className={styles.podiumBarGold}>WINNER</div>
              </div>
            )}

            {/* 3rd Place */}
            {third ? (
              <div className={`${styles.podiumStep} ${styles.stepBronze}`}>
                <div className={styles.podiumMedal}>🥉</div>
                <div className={styles.podiumName}>{third.username}</div>
                <div className={styles.podiumWpm}>{Math.round(third.wpm)} WPM</div>
                <div className={styles.podiumBarBronze}>3RD</div>
              </div>
            ) : (
              <div className={`${styles.podiumStep} ${styles.stepEmpty}`} />
            )}
          </div>
        )}

        {/* Full Leaderboard Table */}
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Player</th>
                <th>Progress</th>
                <th>Speed (WPM)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sortedPlayers.map((player, index) => {
                const progressPercent = totalLength > 0
                  ? Math.min(100, Math.round((player.currentPosition / totalLength) * 100))
                  : 0;

                const isWinner = index === 0;

                return (
                  <tr
                    key={player.id || player.user_id}
                    className={`
                      ${player.isCurrentUser ? styles.currentUserRow : ''}
                      ${isWinner ? styles.winnerRow : ''}
                    `}
                  >
                    <td className={styles.rankCell}>
                      <span className={styles.rankNumber}>
                        {index === 0 ? '🥇 1st' : index === 1 ? '🥈 2nd' : index === 2 ? '🥉 3rd' : `${index + 1}th`}
                      </span>
                    </td>
                    <td className={styles.playerCell}>
                      <span
                        className={styles.colorIndicator}
                        style={{ backgroundColor: player.color }}
                      />
                      <span className={styles.username}>
                        {player.username}
                        {player.isCurrentUser && <span className={styles.youBadge}> (You)</span>}
                      </span>
                    </td>
                    <td className={styles.progressCell}>
                      <div className={styles.progressTrack}>
                        <div
                          className={styles.progressBar}
                          style={{
                            width: `${progressPercent}%`,
                            backgroundColor: player.color
                          }}
                        />
                      </div>
                      <span className={styles.progressPercent}>{progressPercent}%</span>
                    </td>
                    <td className={styles.wpmCell}>
                      <span className={styles.wpmNum}>{Math.round(player.wpm)}</span>
                      <span className={styles.wpmLabel}>WPM</span>
                    </td>
                    <td className={styles.statusCell}>
                      {player.left ? (
                        <span className={styles.statusLeft}>LEFT RACE</span>
                      ) : player.finishedAt ? (
                        <span className={styles.statusFinished}>FINISHED</span>
                      ) : (
                        <span className={styles.statusTyping}>TYPING...</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* User stats summary callout */}
        {currentUser && (
          <div className={styles.personalSummary}>
            <span>Your Result: <strong>{Math.round(currentUser.wpm)} WPM</strong></span>
            {currentUser.finishedAt && (
              <span>Position: <strong>#{sortedPlayers.findIndex(p => p.user_id === currentUserId) + 1}</strong></span>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className={styles.actions}>
          {onRematch && isHost ? (
            <button className={styles.primaryBtn} onClick={onRematch}>
              🔄 Play Again (Rematch)
            </button>
          ) : onRematch ? (
            <div className={styles.statusTyping} style={{ padding: '0.6rem 1.2rem' }}>
              Waiting for host to start a rematch...
            </div>
          ) : null}
          <button className={onRematch && isHost ? styles.secondaryBtn : styles.primaryBtn} onClick={onExit}>
            Return to Lobby
          </button>
        </div>
      </div>
    </div>
  );
}
