# Number Game

A small self-hosted game dashboard that runs on a home server (such as a Proxmox VM or container) and is played from a phone or laptop browser on the local network. The first game on the dashboard is the Number Game, a grid puzzle where you clear pairs of numbers.

## Goals

- Primary: host the Number Game on a local Proxmox server and play it from a phone or laptop browser.
- Secondary: publish the project as a git repository that anyone can clone and host on their own server with minimal setup.
- Future: grow the dashboard so it can host several different games, with the Number Game as the first one.

## The Number Game in Short

- You pick a board width of 10, 11, or 12 and a difficulty when starting a new game. The board starts with width x width random numbers from 1 to 9.
- Tap two numbers that are equal or add up to 10. If they can see each other, both are cleared and you earn points.
- Two numbers can see each other when only empty cells lie between them horizontally, vertically, diagonally, or along the reading order that wraps from the end of one row to the start of the next.
- When a row becomes fully empty, it is removed and the rows below move up.
- If you are stuck, press Add Numbers to add new numbers after the existing ones. The number of uses depends on the difficulty.
- Clearing the whole board gives a bonus and moves you up a stage. The board fills up again and Add Numbers is reset.
- The game only ends when no moves are left and Add Numbers is used up.
- Players create their own player ID. Games are saved automatically on the server in save slots, any slot can be loaded on any device, and high scores are tracked per player ID.

The full rules are in `REQUIREMENTS/number-game-rules.md`.

## Scope

In scope:

- A web dashboard that lists the available games.
- The Number Game, playable with touch and mouse.
- Hosting on a single local server, packaged so others can self-host it.

Out of scope for now:

- Public internet hosting, passwords, and online leaderboards shared beyond your own server.
- Native mobile apps.

## Requirements

The `REQUIREMENTS/` folder holds the detailed requirements:

| File | Contents |
| --- | --- |
| `REQUIREMENTS/platform.md` | Dashboard, multi-game support, hosting, and self-hosting |
| `REQUIREMENTS/number-game-rules.md` | Board, matching, line of sight, row removal, adding numbers, stages, scoring, and game over |
| `REQUIREMENTS/number-game-difficulty.md` | Difficulty presets and ideas for later |
| `REQUIREMENTS/players-saves-scores.md` | Player IDs, server save slots, and high scores |
| `REQUIREMENTS/open-questions.md` | Open decisions, the chosen tech stack, and answered questions |

## Development

Requires Node.js 24 or newer.

- `npm install` installs everything.
- `npm run check` builds every part and runs type checks, lint, the format check, and the tests.
- `npm run format` fixes code formatting.

How the code is organised is described in `ARCHITECTURE.md`.

## Configuration

The server reads these settings from environment variables. Copy `.env.example` to `.env` to change them.

| Variable | Default | Meaning |
| --- | --- | --- |
| `HOST` | `0.0.0.0` | Network address the server listens on. `0.0.0.0` lets phones and laptops on the network connect |
| `PORT` | `3000` | Port the server listens on |
| `DATA_DIR` | `./data` | Folder where the SQLite database with players, saves, and high scores is stored |
| `SAVE_SLOTS_PER_GAME` | `10` | Number of save slots each game has |

## Status

Phase 1 (project setup) is done. Phase 2 (game rules) is next. The work plan is in `TASKS.md`.
