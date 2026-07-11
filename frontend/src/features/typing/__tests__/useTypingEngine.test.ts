import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTypingEngine } from '../useTypingEngine';

// Helper to create a keyboard event
function createKeyEvent(key: string, options: Partial<React.KeyboardEvent> = {}): React.KeyboardEvent {
  return {
    key,
    preventDefault: vi.fn(),
    metaKey: false,
    ctrlKey: false,
    altKey: false,
    ...options,
  } as unknown as React.KeyboardEvent;
}

describe('useTypingEngine', () => {
  const testSnippet = 'hello';

  describe('initial state', () => {
    it('should initialize with correct default values', () => {
      const { result } = renderHook(() => useTypingEngine(testSnippet));

      expect(result.current.snippet).toBe(testSnippet);
      expect(result.current.currentIndex).toBe(0);
      expect(result.current.isStarted).toBe(false);
      expect(result.current.isFinished).toBe(false);
      expect(result.current.charStatuses).toEqual(['untyped', 'untyped', 'untyped', 'untyped', 'untyped']);
      expect(result.current.stats.wpm).toBe(0);
      expect(result.current.stats.accuracy).toBe(100);
    });
  });

  describe('correct typing', () => {
    it('should advance cursor on correct key press', () => {
      const { result } = renderHook(() => useTypingEngine(testSnippet));

      act(() => {
        result.current.handleKeyDown(createKeyEvent('h'));
      });

      expect(result.current.currentIndex).toBe(1);
      expect(result.current.charStatuses[0]).toBe('correct');
      expect(result.current.isStarted).toBe(true);
    });

    it('should mark completion when all chars typed correctly', () => {
      const { result } = renderHook(() => useTypingEngine('hi'));

      act(() => {
        result.current.handleKeyDown(createKeyEvent('h'));
      });
      act(() => {
        result.current.handleKeyDown(createKeyEvent('i'));
      });

      expect(result.current.isFinished).toBe(true);
      expect(result.current.currentIndex).toBe(2);
      expect(result.current.charStatuses).toEqual(['correct', 'correct']);
    });
  });

  describe('incorrect typing', () => {
    it('should mark incorrect character and still advance', () => {
      const { result } = renderHook(() => useTypingEngine(testSnippet));

      act(() => {
        result.current.handleKeyDown(createKeyEvent('x')); // wrong key for 'h'
      });

      expect(result.current.currentIndex).toBe(1);
      expect(result.current.charStatuses[0]).toBe('incorrect');
      expect(result.current.stats.errorCount).toBe(1);
    });

    it('should track errors even after correction with backspace', () => {
      const { result } = renderHook(() => useTypingEngine(testSnippet));

      // Type wrong key
      act(() => {
        result.current.handleKeyDown(createKeyEvent('x'));
      });
      // Backspace
      act(() => {
        result.current.handleKeyDown(createKeyEvent('Backspace'));
      });
      // Type correct key
      act(() => {
        result.current.handleKeyDown(createKeyEvent('h'));
      });

      expect(result.current.currentIndex).toBe(1);
      expect(result.current.charStatuses[0]).toBe('correct');
      // Error count should still show 1 because the position was errored once
      expect(result.current.stats.errorCount).toBe(1);
    });
  });

  describe('backspace handling', () => {
    it('should move cursor back on backspace', () => {
      const { result } = renderHook(() => useTypingEngine(testSnippet));

      act(() => {
        result.current.handleKeyDown(createKeyEvent('h'));
      });
      act(() => {
        result.current.handleKeyDown(createKeyEvent('Backspace'));
      });

      expect(result.current.currentIndex).toBe(0);
      expect(result.current.charStatuses[0]).toBe('untyped');
    });

    it('should not go below index 0', () => {
      const { result } = renderHook(() => useTypingEngine(testSnippet));

      act(() => {
        result.current.handleKeyDown(createKeyEvent('Backspace'));
      });

      expect(result.current.currentIndex).toBe(0);
    });

    it('should count backspace as a keystroke', () => {
      const { result } = renderHook(() => useTypingEngine(testSnippet));

      act(() => {
        result.current.handleKeyDown(createKeyEvent('h'));
      });
      act(() => {
        result.current.handleKeyDown(createKeyEvent('Backspace'));
      });

      // 1 char press + 1 backspace = 2 total keystrokes
      expect(result.current.stats.totalKeystrokes).toBe(2);
    });

    it('should decrement correctChars when backspacing a correct char', () => {
      const { result } = renderHook(() => useTypingEngine(testSnippet));

      act(() => {
        result.current.handleKeyDown(createKeyEvent('h'));
      });

      expect(result.current.stats.correctChars).toBe(1);

      act(() => {
        result.current.handleKeyDown(createKeyEvent('Backspace'));
      });

      expect(result.current.stats.correctChars).toBe(0);
    });
  });

  describe('WPM calculation', () => {
    it('should track correct chars and compute non-negative WPM', () => {
      const { result } = renderHook(() => useTypingEngine('ab'));

      act(() => {
        result.current.handleKeyDown(createKeyEvent('a'));
      });
      act(() => {
        result.current.handleKeyDown(createKeyEvent('b'));
      });

      // correctChars should be tracked
      expect(result.current.stats.correctChars).toBe(2);
      // WPM should be >= 0 (may be 0 in tests due to near-zero elapsed time guard)
      expect(result.current.stats.wpm).toBeGreaterThanOrEqual(0);
      // Verify the finished state sets endTime (implicitly verified by isFinished)
      expect(result.current.isFinished).toBe(true);
    });
  });

  describe('accuracy calculation', () => {
    it('should be 100% when all chars are correct', () => {
      const { result } = renderHook(() => useTypingEngine('ab'));

      act(() => {
        result.current.handleKeyDown(createKeyEvent('a'));
      });
      act(() => {
        result.current.handleKeyDown(createKeyEvent('b'));
      });

      expect(result.current.stats.accuracy).toBe(100);
    });

    it('should decrease with incorrect keystrokes', () => {
      const { result } = renderHook(() => useTypingEngine('ab'));

      act(() => {
        result.current.handleKeyDown(createKeyEvent('x')); // wrong
      });
      act(() => {
        result.current.handleKeyDown(createKeyEvent('b')); // correct
      });

      // 1 correct / 2 total = 50%
      expect(result.current.stats.accuracy).toBe(50);
    });
  });

  describe('modifier keys', () => {
    it('should ignore events with meta key', () => {
      const { result } = renderHook(() => useTypingEngine(testSnippet));

      act(() => {
        result.current.handleKeyDown(createKeyEvent('a', { metaKey: true } as Partial<React.KeyboardEvent>));
      });

      expect(result.current.currentIndex).toBe(0);
      expect(result.current.isStarted).toBe(false);
    });

    it('should ignore events with ctrl key', () => {
      const { result } = renderHook(() => useTypingEngine(testSnippet));

      act(() => {
        result.current.handleKeyDown(createKeyEvent('a', { ctrlKey: true } as Partial<React.KeyboardEvent>));
      });

      expect(result.current.currentIndex).toBe(0);
    });
  });

  describe('post-completion', () => {
    it('should not accept keystrokes after finishing', () => {
      const { result } = renderHook(() => useTypingEngine('ab'));

      // Complete the snippet
      act(() => {
        result.current.handleKeyDown(createKeyEvent('a'));
      });
      act(() => {
        result.current.handleKeyDown(createKeyEvent('b'));
      });

      expect(result.current.isFinished).toBe(true);

      // Try typing more
      act(() => {
        result.current.handleKeyDown(createKeyEvent('c'));
      });

      expect(result.current.currentIndex).toBe(2); // unchanged
    });
  });

  describe('reset', () => {
    it('should reset all state', () => {
      const { result } = renderHook(() => useTypingEngine(testSnippet));

      // Type some chars
      act(() => {
        result.current.handleKeyDown(createKeyEvent('h'));
        result.current.handleKeyDown(createKeyEvent('e'));
      });

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.currentIndex).toBe(0);
      expect(result.current.isStarted).toBe(false);
      expect(result.current.isFinished).toBe(false);
      expect(result.current.charStatuses).toEqual(['untyped', 'untyped', 'untyped', 'untyped', 'untyped']);
      expect(result.current.stats.totalKeystrokes).toBe(0);
      expect(result.current.stats.correctChars).toBe(0);
    });

    it('should accept a new snippet on reset', () => {
      const { result } = renderHook(() => useTypingEngine(testSnippet));

      act(() => {
        result.current.reset('world');
      });

      expect(result.current.snippet).toBe('world');
      expect(result.current.charStatuses.length).toBe(5);
    });
  });
});
