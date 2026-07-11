# Build Prompt: Multiplayer Coding Typing Race Game

## Project Overview

Build a real-time multiplayer typing speed game for programmers, similar to speedcoder.net/TypeRacer but with live multiplayer races. Players join a room, type the same code snippet simultaneously, and see each other's progress in real time as a race.

**Tech stack:**
- Backend: Ruby on Rails 7+ (API mode is fine, but keep ActionCable which requires the full stack)
- Real-time: ActionCable (WebSockets)
- Frontend: React (with Vite), consuming Rails via REST + ActionCable
- Database: PostgreSQL
- Auth: Simple — devise or a lightweight token-based auth is fine; guest play (no signup) should also be supported

---

## Core Features (build in this order — do not skip ahead)

### Phase 1: Single-player core mechanic (no backend yet)
- React component that displays a code snippet, tracks keystrokes character-by-character
- Real-time visual feedback: correctly typed chars styled differently from incorrect ones, current cursor position highlighted
- Calculate live WPM = `(correct_chars / 5) / (elapsed_minutes)` and accuracy = `correct_chars / total_chars_attempted`
- Handle backspace correctly (don't let users "cheat" by deleting mistakes without penalty — track total keystrokes vs correct keystrokes separately from final displayed text)
- On completion, show final stats: WPM, accuracy, time taken, error count

### Phase 2: Persistence (REST, no websockets yet)
- Rails models: `User` (or guest session), `Snippet` (code snippets to type, tagged by language), `TypingResult` (WPM, accuracy, snippet_id, user_id, created_at)
- REST endpoints: `GET /api/snippets` (fetch random snippet, filterable by language), `POST /api/typing_results` (save a completed solo run)
- Basic leaderboard endpoint: `GET /api/leaderboard` (top scores, filterable by language/timeframe)

### Phase 3: Real-time multiplayer races
- Rails models: `Race` (status: waiting/countdown/in_progress/finished, room_code, snippet_id, started_at), `RaceParticipant` (race_id, user_id, current_position, wpm, accuracy, finished_at, joined_at)
- ActionCable `RaceChannel`: subscribe by room_code, broadcast progress updates and race lifecycle events
- Race lifecycle: host creates race → gets shareable room_code → others join → host starts (or auto-starts at N players) → 3-2-1 countdown synced via server timestamp → race begins → live progress broadcast → first to finish or timeout ends race → final results broadcast
- React: room creation/join UI, waiting room showing connected players, live race view with progress bars per player, results screen with final rankings

### Phase 4: Polish
- Reconnection handling (player's state persists server-side if WebSocket drops)
- Server-side WPM/accuracy validation (never trust client-submitted final stats — recompute from server-side timestamps and position data to prevent cheating)
- Snippet variety by language (Ruby, JavaScript, Python, etc.) stored in DB, seeded with real code samples
- User stats page (race history, personal best WPM, accuracy trend over time)

### Phase 5 (stretch goals — only if time allows)
- Public matchmaking queue (auto-pair waiting players instead of requiring room codes)
- Spectator mode
- ELO-style ranking system

---

## Technical Requirements & Constraints

**Real-time performance:**
- Do NOT broadcast a WebSocket message on every keystroke — this will overwhelm ActionCable at scale. Throttle/debounce client-side progress updates to every ~150-250ms or every N characters typed.
- Local typing feedback (the player's own cursor/highlighting) must render instantly from local state — never wait on a network round-trip for the player's own keystrokes to appear.

**Anti-cheat:**
- Recompute final WPM and accuracy server-side from timestamps (`finished_at - started_at`) and validated character counts. Do not trust client-reported final stats directly — validate them.
- Sanity-check outlier WPM values (e.g., >250 WPM is almost certainly not legitimate human typing) and flag/exclude from public leaderboards.

**Race fairness:**
- All players must see the exact same snippet text.
- Countdown must be synced to a server-provided timestamp, not each client's local clock, to prevent players who see the countdown finish first from getting a head start.

**Data model correctness:**
- `RaceParticipant.current_position` tracks correctly-typed character count, not raw keystrokes.
- A race should handle players finishing at different times gracefully — don't end the race for everyone the instant the first player finishes; give others a reasonable window to complete or mark them as "did not finish."

**Frontend/backend separation:**
- React app should be a distinct frontend (Vite-based), consuming Rails as an API + WebSocket backend. Use `@rails/actioncable` npm package for the WebSocket client.
- Keep API responses JSON, follow REST conventions for the non-realtime endpoints.

---

## What I want from you (the agent)

1. Start by proposing the full folder structure and confirming the plan before writing code — I want to sanity check the architecture first.
2. Build Phase 1 completely and let me test it before moving to Phase 2. Do not build all phases in one pass.
3. Write RSpec tests for the Rails models and ActionCable channel logic (especially the server-side WPM recalculation and race lifecycle transitions — these are the parts most likely to have subtle bugs).
4. Write basic React component tests for the typing input logic (correct/incorrect character tracking, WPM calculation).
5. Flag any place where you're making an architectural assumption I haven't specified, rather than silently picking one.
6. Keep commits/changes scoped per phase so I can review incrementally.

---

## Explicitly out of scope for now
- Mobile app / native clients
- OAuth/social login (basic auth or guest sessions only)
- Payments or premium features
- i18n/localization
