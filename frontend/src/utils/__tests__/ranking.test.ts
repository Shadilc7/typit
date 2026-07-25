import { describe, it, expect } from 'vitest';
import { sortMultiplayerPlayers } from '../ranking';

describe('Option 1 Strict Correction Mode Ranking System', () => {
  describe('sortMultiplayerPlayers', () => {
    it('should rank the player who finished earlier as 1st Place (Winner)', () => {
      const playerA = {
        id: '1',
        username: 'Fast Typist',
        currentPosition: 300,
        wpm: 120,
        finishedAt: '2026-07-25T12:00:15Z' // Finished first!
      };

      const playerB = {
        id: '2',
        username: 'Slower Typist',
        currentPosition: 300,
        wpm: 60,
        finishedAt: '2026-07-25T12:00:30Z' // Finished 15s later
      };

      const sorted = sortMultiplayerPlayers([playerA, playerB]);
      expect(sorted[0].id).toBe('1'); // Player A finished earlier, so Player A wins!
      expect(sorted[1].id).toBe('2');
    });

    it('should rank finished players above active unfinished players', () => {
      const finishedPlayer = {
        id: '1',
        username: 'Finisher',
        currentPosition: 300,
        wpm: 80,
        finishedAt: '2026-07-25T12:00:20Z'
      };

      const activePlayer = {
        id: '2',
        username: 'Still Typing',
        currentPosition: 280,
        wpm: 90,
        finishedAt: null
      };

      const sorted = sortMultiplayerPlayers([activePlayer, finishedPlayer]);
      expect(sorted[0].id).toBe('1'); // Finished player ranks first
      expect(sorted[1].id).toBe('2');
    });

    it('should rank active players by furthest progress (currentPosition)', () => {
      const playerAhead = {
        id: '1',
        username: 'Ahead',
        currentPosition: 200,
        wpm: 75,
        finishedAt: null
      };

      const playerBehind = {
        id: '2',
        username: 'Behind',
        currentPosition: 100,
        wpm: 80,
        finishedAt: null
      };

      const sorted = sortMultiplayerPlayers([playerBehind, playerAhead]);
      expect(sorted[0].id).toBe('1'); // Player with higher position leads
    });

    it('should put players who left the race at the bottom', () => {
      const playerLeft = {
        id: '1',
        username: 'Leaver',
        currentPosition: 300,
        wpm: 150,
        finishedAt: null,
        left: true
      };

      const playerActive = {
        id: '2',
        username: 'Active',
        currentPosition: 50,
        wpm: 40,
        finishedAt: null,
        left: false
      };

      const sorted = sortMultiplayerPlayers([playerLeft, playerActive]);
      expect(sorted[0].id).toBe('2');
      expect(sorted[1].id).toBe('1');
    });
  });
});
