# Architecture

This file describes how the code is organised and how its parts talk to each other. The requirements behind these choices are in the `REQUIREMENTS/` folder.

## Parts

The repository is one npm workspace with these parts:

| Folder | Package | Job |
| --- | --- | --- |
| `packages/seeded-random` | `@local/seeded-random` | The seeded random number generator shared by the game rules packages. No browser or server code. See Randomness below |
| `packages/game-server-api` | `@local/game-server-api` | TypeBox schemas of every server request body and answer, shared by the server and the browser app |
| `packages/number-game` | `@local/number-game` | The Number Game rules as plain TypeScript. No browser or server code. Its files are listed in `packages/number-game/README.md` |
| `packages/block-game` | `@local/block-game` | The Block Game rules as plain TypeScript. No browser or server code. Its files are listed in `packages/block-game/README.md` |
| `packages/disk-game` | `@local/disk-game` | The Disk Game rules as plain TypeScript. No browser or server code. Its files are listed in `packages/disk-game/README.md` |
| `apps/server` | `@local/server` | Fastify server. Stores players, saves, and high scores in SQLite, applies moves, and serves the built browser app |
| `apps/web` | `@local/web` | Svelte app built with Vite. Shows the dashboard and the games |

Dependencies only point one way: `apps/server` and `apps/web` both use the packages, the game rules packages use `packages/seeded-random`, and the packages use neither app. A rules package never uses another game's rules package. The browser and the server talk only over HTTP.

## Adding a Game

Each game provides its own rules package plus one module for each app:

- Rules package: a folder under `packages/` with a `README.md` that lists its files. It owns every fact the two apps must agree on: the game id, the game state type, the move type, one function that applies any move, the summary of a state for save slots and high scores, a check that reads stored states and summary details back, and the upgrade lists for older stored formats.
- Server module: registers the game with the server game registry. It adds the TypeBox schemas of the new game options and the moves, and checks when it compiles that the move schema matches the rules package move type. Everything else it passes on from the rules package. The shared save slot and move routes call it for the game named in the URL, so a game does not need routes of its own. The modules are `apps/server/src/games/number-game.ts`, `apps/server/src/games/block-game.ts`, and `apps/server/src/games/disk-game.ts`, and every game is listed in `apps/server/src/games/create-game-registry.ts`.
- Browser module: registers the game with the browser game registry under the id from the rules package. It gives the dashboard a name and a description, the high score categories, a way to label the summary details, and loaders for the new game options form and the play screen. The loaders use a dynamic `import()`, so a game's form and play screen are only downloaded the first time they are needed and the dashboard stays small as games are added. The modules are `apps/web/src/games/number-game/number-game-module.ts`, `apps/web/src/games/block-game/block-game-module.ts`, and `apps/web/src/games/disk-game/disk-game-module.ts`, and every game is listed in `apps/web/src/games/create-browser-game-registry.ts`.
- Requirements: a folder under `REQUIREMENTS/` named after the game.
- Registrations: the new package is added to the workspace list in the root `package.json`, which must stay in build order with dependencies first, and to the `Dockerfile`.

The dashboard, players, save slots, and high scores are shared code that works with any registered game through the game id. Shared code never contains rules for a specific game. (PL-04, PL-05, PL-06, PL-17)

## How a Move Travels

The server is the source of truth for every saved game.

1. The browser opens the save named in the page link, by slot and save id, and receives the full game state.
2. The player makes a move, such as a match. The browser applies it right away with the rules package so the screen responds instantly.
3. The browser sends the move, not the new state, to the server.
4. The server checks that the slot still holds this save and that this device holds the lock, applies the same move to its stored state with the same rules package, and saves the result. It answers only whether the game is over, and the result that went into the high scores if it is.
5. If the server refuses the move, the browser shows the reason and offers to reload the server state. If the slot no longer holds this save, it offers Load Game, New Game, and the dashboard instead. (PS-07, PS-08, PS-18, PS-19)

Because the server applies every move itself, a changed browser cannot save an impossible board or a fake high score.

## Randomness

New boards, Add Numbers, Block Game shapes, and Disk Game layouts use a seeded random number generator whose state is part of the game state. The server picks a random seed when it starts a new game, so the rules package itself has no hidden randomness. Since the browser and the server start from the same state, they produce the same numbers for the same move. A save loaded on another device continues with exactly the same upcoming numbers.

## Storage

The server stores everything in one SQLite file inside `DATA_DIR`. Tables are created and upgraded by migrations that run when the server starts. (PS-03, PS-13)

Each save row has a random save id, made with `crypto.randomUUID()` when a game starts. A slot holds many games one after another, so the save id is what tells them apart. The migration that added it gave every save that already existed its own random id. (PS-19)

Game states and high score summary details are stored as JSON, each with the format version of the game that wrote it. Before the server uses one, it runs the game's upgrades from the stored version to the newest, then checks it with the rules package. This works like the database migrations, but each game keeps its own list. A stored format newer than the server knows, or one that fails the check, is refused with the error `broken-save` or `broken-high-score` instead of being loaded. The server does not write the upgraded state back on its own. The next move saves it in the newest format.

## Configuration

The server reads its settings from environment variables when it starts. A setting that is not set uses its default, and the server stops with a clear error if a value is invalid. Every setting is listed in the Configuration section of `README.md` and in `.env.example`. (PL-12)

## Server

`apps/server/src` is laid out by job:

| Path | Job |
| --- | --- |
| `index.ts` | Reads the settings, opens the database, and starts listening |
| `config.ts` | Reads and checks the settings from environment variables |
| `app.ts` | Builds the Fastify app from its parts. Tests use it with an in-memory database |
| `http-error.ts` | The `HttpError` class and the handler that turns every error into the shared error shape |
| `request-schemas.ts` | TypeBox schemas for URL parameters and the device ID header. Request bodies and answers come from `@local/game-server-api` |
| `typed-fastify.ts` | The Fastify instance type that carries the TypeBox types |
| `database/` | Opening the SQLite file, migrations, and one store per table |
| `games/` | The game registry, the stored format upgrade runner, and each game's server module |
| `routes/` | One file per group of routes, plus `request-lookups.ts` for the game, slot, save, and player lookups that several routes start with |
| `test-support.ts` | Test server and save builders for the tests. Left out of the build |
| `counter-test-game.ts` | A tiny counter game used by the tests of shared code, so they do not depend on the rules of a real game. Left out of the build |

The server uses the SQLite support built into Node.js (`node:sqlite`), so there is no native package to compile. Request bodies, parameters, and headers are checked with TypeBox schemas, which also give the route handlers their types. Each route also has a schema for its successful answer, so a handler that returns the wrong shape fails to compile.

## Server API

Every error response has the shape `{ "error": "<code>", "message": "<text>" }`. A refused move also has a `reason` field, such as `not-a-pair`.

| Method and path | Job |
| --- | --- |
| `GET /api/health` | Reports that the server is running |
| `GET /api/players` | Lists player IDs |
| `POST /api/players` | Creates a player ID. Refuses a duplicate in any letter case |
| `GET /api/games/:gameId/slots` | Lists every slot, with a summary of each used one |
| `POST /api/games/:gameId/slots/:slotNumber` | Starts a new game in an empty slot and answers with its new save id |
| `POST /api/games/:gameId/slots/:slotNumber/saves/:saveId/open` | Loads a save and locks it to this device |
| `DELETE /api/games/:gameId/slots/:slotNumber/saves/:saveId` | Deletes a save, which empties its slot |
| `POST /api/games/:gameId/slots/:slotNumber/saves/:saveId/moves` | Applies one move and saves it. Ends the game when no moves are left, and then answers with the result |
| `GET /api/games/:gameId/high-scores` | Top results. Optional `category` (such as the difficulty) and `limit` |
| `GET /api/games/:gameId/personal-bests/:playerId` | A player's best result per category |

The slot list, the start answer, and the open answer all carry the save id. Open, move, and delete name the save in the URL. If the slot is empty or holds a different save, they are refused with status 410 and the error `save-gone`, and nothing changes. This check comes before the lock check, so a stale page is never offered to take the lock of a newer game. (PS-19, PS-21)

Requests that start, open, or change a save must send an `x-device-id` header. The browser makes up a random device ID once and keeps it. Opening a save moves its lock to that device, and moves from any other device are refused with the error `opened-elsewhere`. (PS-18)

High scores store a `category` used for filtering and a `details` object shown next to the score. For the Number Game, the category is the difficulty, and the details are the stage, width, and difficulty. For the Block Game, the category is the board size, and the details are the board size and the lines cleared. For the Disk Game, the category is the starting disk count, and the details are the stage, the starting disk count, and, for a save only, the moves left.

Paths outside `/api/` serve the built browser app from `apps/web/dist`, and unknown pages get its `index.html` so the browser app can handle its own page routing. If the browser app has not been built, the server logs a warning and serves only the API.

## Browser App

`apps/web/src` is laid out by job:

| Path | Job |
| --- | --- |
| `main.ts` and `App.svelte` | Start the app, show the header with the dashboard link, and pick the page for the current URL |
| `app.css` | Shared look of every page, built for phone portrait screens first |
| `routing/` | Page paths and page routing with the browser history |
| `api/` | One function per server route. Every answer is checked with the shared schemas from `@local/game-server-api` before it is used |
| `api/device-id.ts` | The random device ID kept in local storage and sent in the `x-device-id` header |
| `saving/move-sync.ts` | Sends moves to the server one at a time and in order, retries failed saves, and stops when the save was opened elsewhere or is gone |
| `games/` | The browser game registry and each game's browser module |
| `audio/` | The shared sound player. It makes short tones in the browser, so games need no audio files, and keeps the mute choice from the header button in local storage (PL-18, PL-19) |
| `test-support/` | Helpers for the tests, such as a local storage kept in memory. Only tests use them |
| `pages/` | One Svelte component per page: dashboard, game menu, new game, load game, play, outdated play link, not found, and high scores |
| `components/` | Pieces of pages: the sound mute button, the save slot list, the player ID picker, the save status banner, the save gone notice, the top results table, and the personal bests list |

Pages and their paths:

| Path | Page |
| --- | --- |
| `/` | Dashboard with every registered game |
| `/games/:gameId` | Game menu with New Game, Load Game, and High Scores |
| `/games/:gameId/new` | Pick an empty slot, then a player ID, then the game's options |
| `/games/:gameId/load` | Pick a used slot to continue, or delete one |
| `/games/:gameId/slots/:slotNumber/saves/:saveId` | Opens the save and shows the game's play screen |
| `/games/:gameId/slots/:slotNumber` | An older play link without a save id. It opens no game and links to Load Game, New Game, and the dashboard (PS-20) |
| `/games/:gameId/high-scores` | Top results with a category filter, and personal bests |
| Any other path | Not found page with a link to the dashboard |

The play page loads the save and hands its state to the game's play screen. The play screen applies each move with the rules package, then hands the move to the move sync. Network errors and server errors are retried with growing waits, and the save status banner tells the player while that happens. A move the server refuses, or a save that was opened on another device, stops saving and offers to reload the game from the server. A save that is gone, because the game ended, was deleted, or a new game took the slot, stops saving too. Then the page offers Load Game, New Game, and the dashboard, never a reload, and reloading the page shows the same message. A finished game still shows its game over panel, since the last move was saved before the slot was emptied. Leaving the page while moves are still unsaved shows the browser's leave warning. Leaving through a link inside the app shows no warning, so the move sync still sends the moves that are queued, without retrying a send that fails. (PS-07, PS-08, PS-18, PS-19)

The Number Game play screen still calls the single rules (`applyMatch`, `applyAddNumbers`, `applyHint`) instead of `applyMove`, because it needs what only they return, such as whether a stage was cleared and which pair a hint shows. The moves it sends use the `NumberGameMove` type from the rules package.

Sounds and effects only show what happened and never change the game state. The play screen picks the Number Game sound for each event from `number-game-sounds.ts` and plays it with the shared sound player. After a match it also hands the board a short-lived match effect: a burst on both cleared cells and the points earned, placed with the cell positions from before the move. (NG-30, NG-31)

The Disk Game play screen also calls the single rules (`applyDiskMove`, `applyUndo`, `applyHint`), because it needs the stage clear, and the move a hint shows. When a move clears a stage, the rules already hold the next stage's layout, so the play screen keeps showing the sorted pegs from the stage clear for a moment, with the points floating up, before it shows the new layout. Which peg a tap picks up from or drops onto is decided in `tap-peg.ts`. (DK-09, DK-23)

## Packaging

The `Dockerfile` builds the image in two stages. The first installs every dependency and runs `npm run build`. The second keeps only the built `dist` folders and the dependencies needed at run time, and runs the server as the unprivileged `node` user (user id 1000). Inside the container the server always uses `HOST=0.0.0.0`, `PORT=3000`, and `DATA_DIR=/data`. A health check calls `/api/health`.

`compose.yaml` maps the host `PORT` to port 3000, mounts the host `DATA_DIR` folder as `/data` so the database survives rebuilds, and passes the rest of `.env` to the server. The data folder must be writable by user id 1000. Before opening the database, the server checks that its data folder is writable and stops with an error naming the folder if it is not. (PL-14, PL-15)

## Tooling

| Tool | Use |
| --- | --- |
| TypeScript | Strict type checking with the shared settings in `tsconfig.base.json` |
| ESLint | Strict type-aware lint rules from `typescript-eslint` |
| Prettier | Code formatting. Markdown files are skipped because they follow the documentation style guide in `CLAUDE.md` |
| Vitest | Unit tests, written next to the code as `*.test.ts` files. Shared test helpers live in `test-support.ts` |
| TypeBox | The shared request and answer schemas. They check server requests and give route handlers their types, and the browser app uses them to check server answers |
| Vite | Builds the browser app and runs its dev server, which sends `/api` calls to the server on `PORT` |
| svelte-check | Type checks the Svelte components with the same strict settings |
| Docker | Packages the server and the built browser app into one image, run with docker compose |

`npm run check` builds every part, then runs type checks, lint, the format check, and the tests.

The server and the browser app use the built `dist` folder of each package, not its source. After changing a package, run `npm run build` before type checking the apps, or just run `npm run check`.

## Test Coverage

The rules packages, the server, and the browser app's routing, server calls, saving, and game logic helpers have tests. The Svelte components do not.
