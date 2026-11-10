# Audit

This audit checks whether the project will stay maintainable as more games are added to the dashboard. Cleanliness and readability are secondary goals. It covers every source file, config file, and document in the repository as of 2026-11-10, including the uncommitted Phase 4 browser app. `npm run check` passed at the time of the audit (25 test files, 156 tests).

## Verdict

The project will not explode in size as games are added. The shared code (dashboard, players, save slots, high scores, move saving) does not grow when a game is added, and the per-game code stays in its own folders. Adding a game today costs:

| Part | New files | Shared files touched |
| --- | --- | --- |
| Rules package | One new folder under `packages/` with `package.json`, two tsconfig files, and the rules | None |
| Server | One module like `apps/server/src/games/number-game.ts` (about 80 lines) | One line in `create-game-registry.ts` and one dependency in `apps/server/package.json` |
| Browser | One folder like `apps/web/src/games/number-game/` | One line in `create-browser-game-registry.ts` and one dependency in `apps/web/package.json` |

Files are small and do one job. The largest source file is `NumberGamePlayScreen.svelte` at 213 lines, and most files are under 100 lines. Typing is strict everywhere, errors fail loudly, and there are no `any` types or ignore comments.

The real risks are not file count or length. They are contracts that are written twice and kept in sync only by comments, saved game states that cannot be upgraded, and shared tests that depend on the Number Game. These are listed below, most important first.

## Findings

### A-01: Saved game states cannot be upgraded

Priority: high

Database tables have migrations (`apps/server/src/database/migrations.ts`), but the game states stored as JSON inside `save_slots.state_json` do not. `parseGameState` in `packages/number-game/src/parse-game-state.ts` rejects any unknown field and requires every known field. So the first time a rules change adds, renames, or removes a field in `GameState`, every existing save becomes a `broken-save` error and cannot be loaded. The same applies to every future game, and to the `details_json` stored with high scores.

Suggested fix: add a state version number to each game's state and an `upgradeState(stored: unknown): unknown` step to `ServerGameDefinition` in `apps/server/src/games/game-registry.ts`, run before `parseState`. Each game keeps its own list of state upgrades, the same way the database keeps its list of migrations. This is cheapest to add now, while no real saves exist yet.

### A-02: The server API shapes are written twice

Priority: high

The server routes return plain object literals with no response schemas, and the browser keeps its own copy of every answer shape in `apps/web/src/api/game-server-api.ts`. `ARCHITECTURE.md` says both must be updated together, but nothing checks it. A field renamed on the server only fails at run time in the browser.

Suggested fix: move the request and response TypeBox schemas into a small shared package, for example `packages/game-server-api`. The server uses them as Fastify `response` schemas, which also checks its own answers, and the browser imports the same schemas to check answers. This is shared code, so it is written once no matter how many games are added.

### A-03: Each game's moves, options, summary details, and id are written in several places

Priority: high

For the Number Game, the same facts live in separate files that only point at each other with comments:

| Fact | Places it is written |
| --- | --- |
| Game id `number-game` | `NUMBER_GAME_ID` in `apps/server/src/games/number-game.ts` and the literal in `apps/web/src/games/number-game/number-game-module.ts` |
| Move shape | TypeBox `moveSchema` in the server module and the hand-written `NumberGameMove` type in `apps/web/src/games/number-game/number-game-move.ts` |
| Summary details (`stage`, `width`, `difficulty`) | Built in the server module's `summarize`, read back by hand in `describe-number-game-details.ts` |
| Which move calls which rule | `applyNumberGameMove` in the server module, and again by hand in `NumberGamePlayScreen.svelte` |

Every new game will repeat this pattern, so the number of hand-synced pairs grows with each game.

Suggested fix: let each rules package own its own contract. The Number Game package would export `NUMBER_GAME_ID`, the `NumberGameMove` type, a single `applyMove(state, move)` that dispatches to `applyMatch`, `applyAddNumbers`, and `applyHint`, and a `summarizeGame` function with a typed summary. The server module then only adds the TypeBox schema, with a type check that its `Static` type equals `NumberGameMove`, and the browser imports the type and the id. The browser and server would then share one dispatcher, which also keeps their moves from drifting apart.

### A-04: Shared server tests depend on the Number Game

Priority: medium

`apps/server/src/test-support.ts` builds saves from a Number Game `GameState`, and the save slot, move, high score, web app, and registry tests all use the real Number Game. A change to the Number Game rules can break tests of shared code that has not changed, and testing the shared routes with a second game means copying test helpers.

Suggested fix: add a tiny fake game (for example a counter whose only move adds 1 and ends at 3) to the test helpers, and use it for the shared route tests. Keep Number Game specific server tests next to `apps/server/src/games/number-game.ts`.

### A-05: Documents will grow with every game

Priority: medium

`ARCHITECTURE.md` holds a file-by-file table of the Number Game rules package, and the Number Game requirements sit loose in `REQUIREMENTS/` next to platform requirements. With five games, `ARCHITECTURE.md` would hold five rules tables and `REQUIREMENTS/` would mix five games' files.

Suggested fix: keep `ARCHITECTURE.md` about the platform and the "Adding a Game" contract. Move each game's file table into a `README.md` inside its own package, and move per-game requirements into a folder per game, such as `REQUIREMENTS/number-game/rules.md` and `REQUIREMENTS/number-game/difficulty.md`.

### A-06: Every game is in the first browser download

Priority: low

`apps/web/src/games/create-browser-game-registry.ts` imports every game's play screen directly, so the dashboard downloads the code of every game before showing anything. On a local network this is fine for a few games, but it grows with each one.

Suggested fix, when there are three or more games: keep the name, description, and categories in the registry, and load `PlayScreen` and `NewGameOptionsForm` with a dynamic `import()` the first time they are needed.

### A-07: Repeated checks in the server routes

Priority: low

Four route handlers repeat the same opening steps: find the game, check the slot number, and require a save. The "unknown player" 404 error is also written twice, in `save-slot-routes.ts` and `high-score-routes.ts`.

Suggested fix: add a `requirePlayerId` helper next to `requireSave` in `apps/server/src/routes/slot-access.ts` (renamed to fit), and one helper that returns the game and the save for a slot request.

### A-08: Move answers carry data that nothing reads

Priority: low

The move route returns `state` and `details` (such as `removedRowCount` and `addedCount`), and the server module builds `details` for every move type. The browser ignores both, since it has already applied the move itself. This is extra contract that every game must fill in and keep in sync.

Suggested fix: drop `details` from `GameMoveOutcome` and the move answer until something uses it. Keep `gameOver` and `result`, which the browser could use to confirm the final score.

### A-09: The high scores page does two jobs

Priority: low

`apps/web/src/pages/HighScoresPage.svelte` (163 lines) shows both the top results table and the personal bests list, each with its own loading and error states.

Suggested fix: split it into a `TopResultsTable` and a `PersonalBestsList` component, with the page only holding the category filter and player picker.

### A-10: Phase 4 is not committed

Priority: low, but easy to lose

The whole browser app (Phase 4) is uncommitted in the working tree. It passes `npm run check`, so it is ready to commit before any of the changes above start.

## What Is Already Good

- The game registries on both sides keep every game behind one interface, and shared pages never look inside a game state, as PL-04 to PL-06 require.
- Routes are generic over the game id in the URL, so a new game needs no new routes.
- The server applies every move itself with the same rules package, so the browser cannot save a fake state.
- Strict TypeScript settings, type-aware ESLint, and checked server answers make mistakes show up early.
- Tests sit next to the code they test, and `npm run check` runs every check with one command.
- Settings are read from the environment and documented in `README.md` and `.env.example`.

## Suggested Order

1. Commit Phase 4 (A-10).
2. Add state versions and upgrades (A-01), before any real saves exist.
3. Move each game's contract into its rules package (A-03) and share the server API schemas (A-02).
4. Add the fake test game (A-04) and reorganise the documents (A-05).
5. Handle A-06 to A-09 when the second game is added.

## Resolution

Applied on 2026-11-10, with `npm run check` passing afterwards.

| Finding | Outcome |
| --- | --- |
| A-01 | Done. Saves and high scores store a format version, and each game gives upgrade lists that run before its check. The Number Game lists live in `packages/number-game/src/stored-format-upgrades.ts` |
| A-02 | Done. `packages/game-server-api` holds the request and answer schemas. Server routes use them as response schemas, and the browser checks answers with them |
| A-03 | Done. The rules package owns the id, the move type, `applyMove`, and the summary. The server checks its move schema against the move type when it compiles. The play screen still calls the single rules because it needs their extra results |
| A-04 | Done. Shared route tests use `apps/server/src/counter-test-game.ts`. Number Game server tests are in `apps/server/src/games/number-game.test.ts` |
| A-05 | Done. The rules file table is in `packages/number-game/README.md`, and the Number Game requirements are in `REQUIREMENTS/number-game/` |
| A-06 | Not done yet, as the finding suggests. Tracked as T-43 in `TASKS.md` |
| A-07 | Done. `apps/server/src/routes/request-lookups.ts` replaces `slot-access.ts` |
| A-08 | Done. The move answer no longer carries `details` or `state` |
| A-09 | Done. Split into `TopResultsTable.svelte` and `PersonalBestsList.svelte` |
| A-10 | Done. Phase 4 was committed before the other changes |
