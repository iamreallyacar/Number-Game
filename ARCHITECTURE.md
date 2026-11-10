# Architecture

This file describes how the code is organised and how its parts talk to each other. The requirements behind these choices are in the `REQUIREMENTS/` folder.

## Parts

The repository is one npm workspace with three parts:

| Folder | Package | Job |
| --- | --- | --- |
| `packages/number-game` | `@local/number-game` | The Number Game rules as plain TypeScript. No browser or server code |
| `apps/server` | `@local/server` | Fastify server. Stores players, saves, and high scores in SQLite, applies moves, and serves the built browser app |
| `apps/web` | `@local/web` | Svelte app built with Vite. Shows the dashboard and the games |

Dependencies only point one way: `apps/server` and `apps/web` both use `packages/number-game`, and the rules package uses neither of them. The browser and the server talk only over HTTP.

## Adding a Game

Each game provides its own rules package plus one module for each app:

- Rules package: a folder under `packages/` holding the game state type, the move types, and pure functions that apply a move to a state.
- Server module: registers the game with the server game registry under a unique game id. It gives the server the shapes of its new game options and moves, how to start a new game, how to check a stored state, how to apply a move, when the game is over, and a summary of a state for save slots and high scores. The shared save slot and move routes call these for the game named in the URL, so a game does not need routes of its own. The Number Game module is `apps/server/src/games/number-game.ts`, and every game is listed in `apps/server/src/games/create-game-registry.ts`.
- Browser module: registers the game with the browser game registry under the same game id. It gives the dashboard a name and a description, the high score categories, a way to label the summary details, a new game options form, and the play screen. The Number Game module is `apps/web/src/games/number-game/number-game-module.ts`, and every game is listed in `apps/web/src/games/create-browser-game-registry.ts`.

The dashboard, players, save slots, and high scores are shared code that works with any registered game through the game id. Shared code never contains rules for a specific game. (PL-04, PL-05, PL-06, PL-17)

## How a Move Travels

The server is the source of truth for every saved game.

1. The browser loads a save slot and receives the full game state.
2. The player makes a move, such as a match. The browser applies it right away with the rules package so the screen responds instantly.
3. The browser sends the move, not the new state, to the server.
4. The server checks the device lock, applies the same move to its stored state with the same rules package, and saves the result.
5. If the server refuses the move, the browser shows the reason and reloads the server state. (PS-07, PS-08, PS-18)

Because the server applies every move itself, a changed browser cannot save an impossible board or a fake high score.

## Randomness

New boards and Add Numbers use a seeded random number generator whose state is part of the game state. The server picks a random seed when it starts a new game, so the rules package itself has no hidden randomness. Since the browser and the server start from the same state, they produce the same numbers for the same move. A save loaded on another device continues with exactly the same upcoming numbers.

## Storage

The server stores everything in one SQLite file inside `DATA_DIR`. Tables are created and upgraded by migrations that run when the server starts. Game states are stored as JSON and checked with the rules package before they are used. (PS-03, PS-13)

## Configuration

The server reads its settings from environment variables when it starts. A setting that is not set uses its default, and the server stops with a clear error if a value is invalid. Every setting is listed in the Configuration section of `README.md` and in `.env.example`. (PL-12)

## Number Game Rules Package

`packages/number-game` exports everything through `src/index.ts`. Every function is pure: it takes a game state and returns a new one without changing the old one.

| File | Job |
| --- | --- |
| `game-state.ts` | The `GameState` type. Cells are a flat list in reading order, padded with empty cells to whole rows |
| `cell.ts` | The `Digit` and `Cell` types |
| `board.ts` | Row and column math, counting numbers, and removing empty rows |
| `random.ts` | Mulberry32 seeded random numbers. The generator state is stored in the game state |
| `difficulty.ts` | Easy, Normal, and Hard presets |
| `stage-board.ts` | Fills a new stage board. On Easy, many cells are made to pair with the cell before them |
| `new-game.ts` | Starts a game from a width, a difficulty, and a seed chosen by the caller |
| `scoring.ts` | Points for matches, empty rows, and stage clears |
| `pair.ts` and `line-of-sight.ts` | Whether two numbers are a pair and whether they can see each other |
| `match.ts` | Applies a match, removes empty rows, adds points, and moves to the next stage when the board is cleared |
| `add-numbers.ts` | Applies Add Numbers |
| `stage-clear.ts` | Adds the stage bonus and fills a new board |
| `find-pair.ts` and `hint.ts` | Finds a valid pair for hints, the stuck warning, and game over |
| `parse-game-state.ts` | Checks a stored game state and throws `InvalidGameStateError` if it is broken |
| `test-support.ts` | Board builders for the tests. Left out of the build |

Moves that a player can get wrong, such as a match that is not a pair, return a result with `accepted: false` and a reason, so the server can tell the browser why a move was refused. Mistakes in the calling code, such as advancing a stage while numbers are left, throw an error.

## Server

`apps/server/src` is laid out by job:

| Path | Job |
| --- | --- |
| `index.ts` | Reads the settings, opens the database, and starts listening |
| `config.ts` | Reads and checks the settings from environment variables |
| `app.ts` | Builds the Fastify app from its parts. Tests use it with an in-memory database |
| `http-error.ts` | The `HttpError` class and the handler that turns every error into the shared error shape |
| `request-schemas.ts` | TypeBox schemas shared by several routes, such as player IDs and the device ID header |
| `typed-fastify.ts` | The Fastify instance type that carries the TypeBox types |
| `database/` | Opening the SQLite file, migrations, and one store per table |
| `games/` | The game registry and each game's server module |
| `routes/` | One file per group of routes |
| `test-support.ts` | Test server and save builders for the tests. Left out of the build |

The server uses the SQLite support built into Node.js (`node:sqlite`), so there is no native package to compile. Request bodies, parameters, and headers are checked with TypeBox schemas, which also give the route handlers their types.

## Server API

Every error response has the shape `{ "error": "<code>", "message": "<text>" }`. A refused move also has a `reason` field, such as `not-a-pair`.

| Method and path | Job |
| --- | --- |
| `GET /api/health` | Reports that the server is running |
| `GET /api/players` | Lists player IDs |
| `POST /api/players` | Creates a player ID. Refuses a duplicate in any letter case |
| `GET /api/games/:gameId/slots` | Lists every slot, with a summary of each used one |
| `POST /api/games/:gameId/slots/:slotNumber` | Starts a new game in an empty slot |
| `POST /api/games/:gameId/slots/:slotNumber/open` | Loads a slot and locks it to this device |
| `DELETE /api/games/:gameId/slots/:slotNumber` | Empties a slot |
| `POST /api/games/:gameId/slots/:slotNumber/moves` | Applies one move and saves it. Ends the game when no moves are left |
| `GET /api/games/:gameId/high-scores` | Top results. Optional `category` (the difficulty) and `limit` |
| `GET /api/games/:gameId/personal-bests/:playerId` | A player's best result per difficulty |

Requests that start, open, or change a save must send an `x-device-id` header. The browser makes up a random device ID once and keeps it. Opening a save moves its lock to that device, and moves from any other device are refused with the error `opened-elsewhere`. (PS-18)

High scores store a `category` used for filtering and a `details` object shown next to the score. For the Number Game, the category is the difficulty, and the details are the stage, width, and difficulty.

Paths outside `/api/` serve the built browser app from `apps/web/dist`, and unknown pages get its `index.html` so the browser app can handle its own page routing. If the browser app has not been built, the server logs a warning and serves only the API.

## Browser App

`apps/web/src` is laid out by job:

| Path | Job |
| --- | --- |
| `main.ts` and `App.svelte` | Start the app, show the header with the dashboard link, and pick the page for the current URL |
| `app.css` | Shared look of every page, built for phone portrait screens first |
| `routing/` | Page paths and page routing with the browser history |
| `api/` | One function per server route. Every answer is checked with TypeBox before it is used |
| `api/device-id.ts` | The random device ID kept in local storage and sent in the `x-device-id` header |
| `saving/move-sync.ts` | Sends moves to the server one at a time and in order, retries failed saves, and stops when the save was opened elsewhere |
| `games/` | The browser game registry and each game's browser module |
| `pages/` | One Svelte component per page: dashboard, game menu, new game, load game, play, and high scores |
| `components/` | Pieces shared by several pages: the save slot list, the player ID picker, and the save status banner |

Pages and their paths:

| Path | Page |
| --- | --- |
| `/` | Dashboard with every registered game |
| `/games/:gameId` | Game menu with New Game, Load Game, and High Scores |
| `/games/:gameId/new` | Pick an empty slot, then a player ID, then the game's options |
| `/games/:gameId/load` | Pick a used slot to continue, or delete one |
| `/games/:gameId/slots/:slotNumber` | Opens the slot and shows the game's play screen |
| `/games/:gameId/high-scores` | Top results with a category filter, and personal bests |

The play page loads the save and hands its state to the game's play screen. The play screen applies each move with the rules package, then hands the move to the move sync. Network errors and server errors are retried with growing waits, and the save status banner tells the player while that happens. A move the server refuses, or a save that was opened on another device, stops saving and offers to reload the game from the server. Leaving the page while moves are still unsaved shows the browser's leave warning. (PS-07, PS-08, PS-18)

The browser app has its own TypeBox shapes for the server answers in `api/game-server-api.ts`, and the Number Game move type in `games/number-game/number-game-move.ts` matches the server move schema. Both must be updated when the server API changes.

## Tooling

| Tool | Use |
| --- | --- |
| TypeScript | Strict type checking with the shared settings in `tsconfig.base.json` |
| ESLint | Strict type-aware lint rules from `typescript-eslint` |
| Prettier | Code formatting. Markdown files are skipped because they follow the documentation style guide in `CLAUDE.md` |
| Vitest | Unit tests, written next to the code as `*.test.ts` files. Shared test helpers live in `test-support.ts` |
| TypeBox | Checks server requests and gives route handlers their types. The browser app uses it to check server answers |
| Vite | Builds the browser app and runs its dev server, which sends `/api` calls to the server on `PORT` |
| svelte-check | Type checks the Svelte components with the same strict settings |

`npm run check` builds every part, then runs type checks, lint, the format check, and the tests.

The server and the browser app use the built `dist` folder of each rules package, not its source. After changing a rules package, run `npm run build` before type checking the apps, or just run `npm run check`.

## Current State

Phases 1 to 4 are done. The rules package, the server, and the browser app are complete. The browser app's routing, server calls, saving, and game logic helpers have tests, but its Svelte components do not, and it still needs a playtest on a phone and a laptop (T-41). The next step is Phase 5 in `TASKS.md`.
