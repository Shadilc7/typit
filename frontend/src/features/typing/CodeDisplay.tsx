import { type CharStatus } from './useTypingEngine';
import styles from './CodeDisplay.module.css';

interface CodeDisplayProps {
  snippet: string;
  charStatuses: CharStatus[];
  typedChars: (string | null)[];
  currentIndex: number;
  isFinished: boolean;
}

/**
 * Renders the code snippet character-by-character with visual states:
 * - Untyped characters: dimmed
 * - Correctly typed: green with subtle glow
 * - Incorrectly typed: red with underline, shows what was actually typed
 * - Current position: blinking cursor highlight
 */
export function CodeDisplay({
  snippet,
  charStatuses,
  typedChars,
  currentIndex,
  isFinished,
}: CodeDisplayProps) {
  // Split into lines for line-number rendering
  const chars = snippet.split('');

  // Track line numbers
  let lineNumber = 1;
  const lineNumbers: number[] = [1]; // First char is always line 1
  for (let i = 1; i < chars.length; i++) {
    if (chars[i - 1] === '\n') {
      lineNumber++;
    }
    lineNumbers.push(lineNumber);
  }
  const totalLines = lineNumber;

  // Group characters by line
  const lines: { chars: typeof lineChars; lineNum: number }[] = [];
  let lineChars: { char: string; index: number; status: CharStatus; typed: string | null }[] = [];
  let currentLineNum = 1;

  for (let i = 0; i < chars.length; i++) {
    if (chars[i] === '\n') {
      // Push the newline as part of the current line, then start a new line
      lineChars.push({ char: chars[i], index: i, status: charStatuses[i], typed: typedChars[i] });
      lines.push({ chars: lineChars, lineNum: currentLineNum });
      lineChars = [];
      currentLineNum++;
    } else {
      lineChars.push({ char: chars[i], index: i, status: charStatuses[i], typed: typedChars[i] });
    }
  }
  // Push final line
  if (lineChars.length > 0) {
    lines.push({ chars: lineChars, lineNum: currentLineNum });
  }

  const gutterWidth = String(totalLines).length;

  return (
    <div className={styles.container} id="code-display">
      <div className={styles.header}>
        <div className={styles.dots}>
          <span className={styles.dot} style={{ background: '#ff5f57' }} />
          <span className={styles.dot} style={{ background: '#febc2e' }} />
          <span className={styles.dot} style={{ background: '#28c840' }} />
        </div>
        <span className={styles.filename}>snippet.code</span>
      </div>
      <pre className={styles.codeArea}>
        <code>
          {lines.map((line) => (
            <div key={line.lineNum} className={styles.line}>
              <span
                className={styles.lineNumber}
                style={{ minWidth: `${gutterWidth + 1}ch` }}
              >
                {line.lineNum}
              </span>
              <span className={styles.lineContent}>
                {line.chars.map(({ char, index, status, typed }) => {
                  const isCursor = index === currentIndex && !isFinished;
                  const displayChar = char === '\n' ? '↵' : char;

                  // For incorrect chars, show what the user actually typed
                  const shownChar = status === 'incorrect' && typed && char !== '\n'
                    ? typed
                    : displayChar;

                  return (
                    <span
                      key={index}
                      className={`
                        ${styles.char}
                        ${styles[status]}
                        ${isCursor ? styles.cursor : ''}
                        ${char === '\n' ? styles.newline : ''}
                      `}
                      data-expected={status === 'incorrect' ? displayChar : undefined}
                    >
                      {shownChar}
                    </span>
                  );
                })}
              </span>
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
}
