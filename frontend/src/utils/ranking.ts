/**
 * Option 1: Strict Correction Mode (TypeRacer Style) Ranking System.
 * 
 * Rules:
 * 1. Players MUST backspace & correct mistakes before advancing.
 * 2. 100% of characters at completion are guaranteed to be correct.
 * 3. Winner = The player who finishes the race first (earliest finishedAt timestamp / highest speed).
 * 4. Live Ranking: Finished players first (by finishedAt ascending), then active players (by currentPosition descending).
 */

export interface PlayerRankable {
  currentPosition: number;
  accuracy?: number;
  correctWords?: number;
  correctChars?: number;
  wpm: number;
  finishedAt: string | null;
  left?: boolean;
}

export function sortMultiplayerPlayers<T extends PlayerRankable>(players: T[]): T[] {
  return [...players].sort((a, b) => {
    // 1. Left players go to the bottom
    if (a.left && !b.left) return 1;
    if (!a.left && b.left) return -1;

    // 2. Primary Winner Rule: Finished players rank by earliest finish time
    if (a.finishedAt && b.finishedAt) {
      return new Date(a.finishedAt).getTime() - new Date(b.finishedAt).getTime();
    }
    if (a.finishedAt) return -1;
    if (b.finishedAt) return 1;

    // 3. Active players rank by furthest progress (currentPosition)
    const posA = a.currentPosition || 0;
    const posB = b.currentPosition || 0;
    if (posB !== posA) {
      return posB - posA;
    }

    // 4. Tie-breaker: higher WPM speed
    return (b.wpm || 0) - (a.wpm || 0);
  });
}
