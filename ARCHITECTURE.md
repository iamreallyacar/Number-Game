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
- Server module: registers the game with the server game registry under a unique game id. It gives the server its routes, how to start a new game, and how to apply a move.
- Browser module: registers the game with the browser game registry under the same game id. It gives the dashboard a name, a description, and the screen to open.

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

New boards and Add Numbers use a seeded random number generator whose state is part of the game state. Since the browser and the server start from the same state, they produce the same numbers for the same move. A save loaded on another device continues with exactly the same upcoming numbers.

## Storage

The server stores everything in one SQLite file inside `DATA_DIR`. Tables are created and upgraded by migrations that run when the server starts. Game states are stored as JSON and checked with the rules package before they are used. (PS-03, PS-13)

## Configuration

The server reads its settings from environment variables when it starts and stops with a clear error if any value is missing or invalid. Every setting is listed in the Configuration section of `README.md` and in `.env.example`. (PL-12)

## Tooling

| Tool | Use |
| --- | --- |
| TypeScript | Strict type checking with the shared settings in `tsconfig.base.json` |
| ESLint | Strict type-aware lint rules from `typescript-eslint` |
| Prettier | Code formatting. Markdown files are skipped because they follow the documentation style guide in `CLAUDE.md` |
| Vitest | Unit tests, written next to the code as `*.test.ts` files |

`npm run check` builds every part, then runs type checks, lint, the format check, and the tests.

The server and the browser app use the built `dist` folder of each rules package, not its source. After changing a rules package, run `npm run build` before type checking the apps, or just run `npm run check`.

## Current State

Phase 1 is done. `packages/number-game`, `apps/server`, and `apps/web` each hold only a placeholder entry file. The next step is Phase 2 in `TASKS.md`.
