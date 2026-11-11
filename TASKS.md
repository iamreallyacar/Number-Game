# Tasks

The work plan for the project. Tasks are grouped into phases that build on each other. Each task lists the requirement IDs it covers from the `REQUIREMENTS/` folder. A task is done when its code is written, its tests pass, and any docs it affects are updated.

## Phase 1: Project Setup

- [x] T-01: Create the git repository with a `.gitignore` and an MIT `LICENSE` file. (PL-16)
- [x] T-02: Set up an npm workspace with three parts: `packages/number-game` for the game rules, `apps/server` for the server, and `apps/web` for the browser app. (PL-04)
- [x] T-03: Add a shared TypeScript config with the strictest checks turned on, including `strict`, `noUncheckedIndexedAccess`, and `exactOptionalPropertyTypes`.
- [x] T-04: Add ESLint with strict TypeScript rules, Prettier, and Vitest, and one command that runs type checks, lint, and tests for every part.
- [x] T-05: Write `ARCHITECTURE.md` describing the three parts, how a game plugs into the dashboard, and how a move travels from the browser to the server and back. (PL-04, PL-05, PL-06)
- [x] T-06: Add a `.env.example` with `HOST`, `PORT`, `DATA_DIR`, and `SAVE_SLOTS_PER_GAME`, and document each one in the README. (PL-12, PL-13, PS-16)

## Phase 2: Number Game Rules

All rules live in `packages/number-game` as plain TypeScript with no browser or server code. The browser and the server both use this package.

- [x] T-07: Define the game state type: width, cells, score, stage, difficulty, Add Numbers and hint uses left, and the random number generator state. The state must turn into JSON and back without losing anything. Then remove `passWithNoTests` from `vitest.config.ts`, since tests now exist.
- [x] T-08: Add a seeded random number generator whose state is stored in the game state, so the browser and the server produce the same numbers. (NG-02, NG-17)
- [x] T-09: Create a new game for a given width and difficulty. (NG-01, NG-02, DF-01)
- [x] T-10: Check whether two numbers are a pair. (NG-05, NG-08)
- [x] T-11: Check line of sight in all four ways: horizontal, vertical, diagonal, and reading order. Include the 3 and 7 example from the rules as a test. (NG-09 to NG-13)
- [x] T-12: Apply a match: clear both cells, remove fully empty rows, and add points. (NG-06, NG-14, NG-15, NG-23)
- [x] T-13: Add Numbers: add the right amount of new numbers after the last number and count down the uses left. (NG-17, NG-18, NG-19)
- [x] T-14: Stage clear: add the bonus, move up a stage, fill a new board, and reset Add Numbers and hints. (NG-20, NG-21, DF-02)
- [x] T-15: Find a valid pair, which is used for hints, the stuck warning, and game over. (DF-03, NG-25, NG-26)
- [x] T-16: Define the three difficulty presets and the Easy starting board that is built to contain many pairs. (DF-01, DF-02)
- [x] T-17: Check that a stored game state is well formed, so a broken save is rejected with a clear error instead of being loaded.

## Phase 3: Server

The server is the source of truth. The browser sends moves, the server applies them with the rules package and saves the result.

- [x] T-18: Set up a Fastify server that reads its settings at startup, uses the default from the README for any setting that is not set, and stops with a clear error if a value is invalid. Add a health check route. (PL-10, PL-12)
- [x] T-19: Create the SQLite tables for players, save slots, and high scores, with a migration step that runs at startup. Store the database file in `DATA_DIR`.
- [x] T-20: Add a game registry on the server, so each game registers its own routes and rules without changes to shared code. (PL-04, PL-05, PL-06)
- [x] T-21: Player routes: list player IDs and create a new one, rejecting duplicates. (PS-01, PS-02, PS-03)
- [x] T-22: Save slot routes: list slots, start a new game in an empty slot, load a slot, and delete a slot. (PS-04, PS-05, PS-06, PS-09, PS-10, PS-11, PS-17)
- [x] T-23: Move route: apply a match, Add Numbers, or hint to a saved game and save it right away. (PS-07)
- [x] T-24: Device lock: a save belongs to the device that opened it last, and moves from any other device are refused with a clear reason. (PS-18)
- [x] T-25: Game over: record the result in the high scores and empty the slot. (NG-27, PS-12, PS-13)
- [x] T-26: High score routes: top results filtered by difficulty, and each player's personal best per difficulty. (PS-14, PS-15)
- [x] T-27: Serve the built browser app from the same server, so only one port is needed. (PL-11)

## Phase 4: Browser App

- [x] T-28: Set up the Svelte app with page routing and a layout that works on phone portrait screens and laptops. Replace the placeholder `build` and `typecheck` scripts in `apps/web` with Vite and `svelte-check`, and add Svelte support to ESLint and Prettier. (PL-07, PL-08)
- [x] T-29: Dashboard page that lists games from a browser-side game registry, with a way back from every game. (PL-01, PL-02, PL-03, PL-05)
- [x] T-30: Player ID screen: pick an existing player ID or create a new one. (PS-01, PS-05)
- [x] T-31: Save slot list used by both New Game and Load Game, showing player ID, stage, score, width, difficulty, and last played time, with a delete option. (PS-04, PS-09, PS-17)
- [x] T-32: New game options screen for width and difficulty. (NG-01, DF-01, PS-05)
- [x] T-33: Board display with large tap targets and vertical scrolling. (NG-03, PL-09)
- [x] T-34: Selecting numbers, matching, and the shake or flash feedback for a wrong match. (NG-04 to NG-07)
- [x] T-35: Score, stage, Add Numbers uses, and hint button shown during play. (NG-16, NG-19, NG-22, NG-24, DF-03)
- [x] T-36: Stuck warning and game over screen with New Game and Dashboard options. (NG-25, NG-27)
- [x] T-37: Show a clear message when a save fails and keep retrying, and when the game was opened on another device. (PS-08, PS-18)
- [x] T-38: High score page with a difficulty filter. (PS-14, PS-15)

## Phase 5: Packaging and Release

- [x] T-39: Write a Dockerfile and a compose file that stores the database in a mounted folder so saves survive updates. (PL-15)
- [x] T-40: Write setup steps in the README for running in a Proxmox VM or LXC container and opening the game from a phone. (PL-10, PL-11, PL-14)
- [ ] T-41: Playtest on a phone and a laptop, then tune the scoring values and difficulty presets. (NG-23, DF-01)

## Audit Follow-up

Findings from `AUDIT.md`.

- [x] T-42: Version stored game states and summary details, share the server API schemas, move each game's contract into its rules package, test shared server code with a fake game, and split the documents per game. (AUDIT.md A-01 to A-05, A-07 to A-10)
- [x] T-43: Load each game's play screen and new game options form only when they are first needed. (AUDIT.md A-06)

## Phase 6: Playtest Improvements

- [x] T-44: Draw grid lines between every row and column of the board. (NG-29)
- [x] T-45: Add a shared sound player that makes short tones in the browser, and a mute button in the site header that is remembered on the device. (PL-18, PL-19)
- [x] T-46: Play the Number Game sounds for selecting, clearing a pair, removing a row, a wrong match, Add Numbers, hints, and clearing a stage. (NG-31, NG-32)
- [x] T-47: Show a burst on cleared cells and a floating points number after each match, turned down for reduced motion. (NG-30, PL-20)
- [x] T-48: Add Numbers only adds numbers that are still on the board, so a number cleared off completely stays gone until the next stage. (NG-17, NG-33)
- [x] T-49: Keep every pair group even: balance new stage boards, leave the last cell empty on odd sized boards, and make Add Numbers even out odd groups. (NG-02, NG-17, NG-34)

## Phase 7: Block Game

The second game. Its requirements are in `REQUIREMENTS/block-game/rules.md`.

- [x] T-50: Move the seeded random number generator into the shared `packages/seeded-random` package so every game's rules package can use it.
- [x] T-51: Write the Block Game requirements. (BG-01 to BG-21)
- [x] T-52: Rules package `packages/block-game`: board, shape catalogue with weights, placing, line clearing, slot refill, scoring with streaks, game over, summary, and stored state checks. (BG-01, BG-02, BG-04 to BG-06, BG-08 to BG-15, BG-19)
- [x] T-53: Server module that registers the Block Game with its new game options and move schemas. (BG-01, BG-05, BG-21)
- [x] T-54: Browser module: dashboard entry, board size form, play screen with drag and drop, landing preview, score and streak, clear effects, sounds, and the game over screen. (BG-03, BG-07, BG-16 to BG-18, BG-20, BG-21)
- [ ] T-55: Playtest the Block Game on a phone and a laptop, then tune the shape weights and scoring values. (BG-10, BG-14)

## Phase 8: Fixes

- [x] T-56: Give every save its own save id and put it in the play page link, so an old link or an open tab for an ended or deleted game cannot open or change a newer game in the same slot, or move its device lock. Old links without a save id open no game. (PS-19, PS-20, PS-21)

## Phase 9: Disk Game

The third game. Its requirements are in `REQUIREMENTS/disk-game/rules.md`.

- [x] T-57: Write the Disk Game requirements. (DK-01 to DK-23)
- [x] T-58: Rules package `packages/disk-game`: layouts, random layout with the reroll rule, fewest moves to the closest peg, moves, undo, hints, stage clear, move budget, scoring, game over, summary, and stored state checks. (DK-01, DK-02, DK-04 to DK-08, DK-10 to DK-17, DK-19, DK-21)
- [x] T-59: Server module that registers the Disk Game with its new game options and move schemas. (DK-04, DK-08, DK-12, DK-13, DK-21)
- [x] T-60: Browser module: dashboard entry, starting disk count form, play screen with tap to pick up and drop, refused drop feedback, undo and hint buttons, score and moves left, stage clear effect, sounds, and the game over screen. (DK-03, DK-09, DK-10, DK-14, DK-18, DK-20, DK-22, DK-23)
- [ ] T-61: Playtest the Disk Game on a phone and a laptop, then tune the reroll rule, the move budget factor, the hint cost, and the scoring values. (DK-07, DK-13, DK-16, DK-17, OQ-20)

## Close-out

The project was closed on 2026-11-11 after it was deployed and used on a home server. The three playtest and tuning tasks (T-41, T-55, T-61) stay unticked, because no tuning pass was made. The scoring values, difficulty presets, shape weights, and move budget values are kept as shipped. The final audit is in `AUDIT.md`.
