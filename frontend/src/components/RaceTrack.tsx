
import { CarSvg } from './CarSvg.tsx';
import styles from './RaceTrack.module.css';

export interface TrackPlayer {
  id: string;
  username: string;
  isCurrentUser: boolean;
  currentPosition: number;
  totalLength: number;
  wpm: number;
  finishedAt: string | null;
  color: string;
}

interface RaceTrackProps {
  players: TrackPlayer[];
}

export function RaceTrack({ players }: RaceTrackProps) {
  return (
    <div className={styles.raceTracksContainer}>
      {players.map((player) => {
        const progressPercent = player.totalLength > 0 
          ? (player.currentPosition / player.totalLength) * 100 
          : 0;
        
        // Calculate safe left position so the car doesn't run off the right edge.
        // We leave about 65px (the width of the car) at the end.
        const positionStyle = {
          left: `calc(${progressPercent}% - ${(progressPercent / 100) * 60}px)`
        };

        return (
          <div key={player.id} className={styles.trackRow}>
            {/* Left Column: Player Info */}
            <div className={styles.playerInfo}>
              <span className={styles.username}>
                {player.username} {player.isCurrentUser && <span className={styles.youBadge}>(you)</span>}
              </span>
            </div>

            {/* Middle Column: The Track */}
            <div className={styles.trackArea}>
              {/* Dashed Line */}
              <div className={styles.dashedLine} />
              
              {/* Moving Car */}
              <div className={styles.carWrapper} style={positionStyle}>
                <CarSvg color={player.color} width={60} height={24} />
              </div>
            </div>

            {/* Right Column: WPM */}
            <div className={styles.wpmInfo}>
              <span className={styles.wpmValue}>
                {Math.round(player.wpm)} <span className={styles.wpmUnit}>wpm</span>
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
