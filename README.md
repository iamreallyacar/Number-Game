# Number Game

A small self-hosted game dashboard that runs on a home server (such as a Proxmox VM or container) and is played from a phone or laptop browser on the local network. The dashboard has three games: the Number Game, a grid puzzle where you clear pairs of numbers, the Block Game, a grid puzzle where you place shapes to fill and clear rows and columns, and the Disk Game, a puzzle where you move disks between three pegs until they all sit on one.

## Goals

- Primary: host the Number Game on a local Proxmox server and play it from a phone or laptop browser.
- Secondary: publish the project as a git repository that anyone can clone and host on their own server with minimal setup.
- Ongoing: grow the dashboard with more games. The Number Game was the first one, the Block Game is the second, and the Disk Game is the third.

## The Number Game in Short

- You pick a board width of 10, 11, or 12 and a difficulty when starting a new game. The board starts with width x width random numbers from 1 to 9.
- Tap two numbers that are equal or add up to 10. If they can see each other, both are cleared and you earn points.
- Two numbers can see each other when only empty cells lie between them horizontally, vertically, diagonally, or along the reading order that wraps from the end of one row to the start of the next.
- When a row becomes fully empty, it is removed and the rows below move up.
- If you are stuck, press Add Numbers to add new numbers after the existing ones. It only adds numbers that are still on the board, so a number you have cleared off completely stays gone until the next stage. The number of uses depends on the difficulty.
- Clearing the whole board gives a bonus and moves you up a stage. The board fills up again and Add Numbers is reset.
- The game only ends when no moves are left and Add Numbers is used up.
- Players create their own player ID. Games are saved automatically on the server in save slots, any slot can be loaded on any device, and high scores are tracked per player ID.

The full rules are in `REQUIREMENTS/number-game/rules.md`.

## The Block Game in Short

- You pick a board size of 8 x 8, 9 x 9, or 10 x 10 when starting a new game. The board starts empty.
- You always have 3 slots, each holding a random shape that fits inside a 3 x 3 box, such as a square, a line, an L, or a diagonal. Shapes cannot be rotated.
- Drag a shape from a slot onto empty cells of the board. The used slot is filled again with a new random shape right away.
- When a row or a column is completely filled, it is cleared. Only the cells inside the full line are cleared, so the rest of a shape stays on the board.
- You earn 1 point for each block you place and more for clearing lines. Clearing several lines at once, or on back-to-back placements, earns extra.
- The game ends when none of the 3 shapes fits anywhere on the board.
- Saves, player IDs, and high scores work the same way as in the Number Game. High scores are filtered by board size.

The full rules are in `REQUIREMENTS/block-game/rules.md`.

## The Disk Game in Short

- There are 3 pegs, and the disks start spread out across them at random. A bigger disk is never on top of a smaller one, at the start or during play.
- You move one top disk at a time to another peg. A stage is cleared when every disk is on any one peg.
- You pick a starting disk count of 3, 4, or 5, and each stage adds one more disk, up to 10.
- Each stage adds moves to a shared budget based on the fewest moves needed, and unused moves carry over. Undo and hints are allowed but cost moves.
- Clearing a stage earns points, with a bonus for a perfect solve. The game ends when you no longer have enough moves left to finish the stage.
- Saves, player IDs, and high scores work the same way as in the other games. High scores are filtered by starting disk count.

The full rules are in `REQUIREMENTS/disk-game/rules.md`.

## Scope

In scope:

- A web dashboard that lists the available games.
- The Number Game, the Block Game, and the Disk Game, playable with touch and mouse.
- Hosting on a single local server, packaged so others can self-host it.

Out of scope for now:

- Public internet hosting, passwords, and online leaderboards shared beyond your own server.
- Native mobile apps.

## Requirements

The `REQUIREMENTS/` folder holds the detailed requirements. Platform requirements sit at the top of the folder, and each game has its own folder:

| File | Contents |
| --- | --- |
| `REQUIREMENTS/platform.md` | Dashboard, multi-game support, hosting, and self-hosting |
| `REQUIREMENTS/number-game/rules.md` | Board, matching, line of sight, row removal, adding numbers, stages, scoring, and game over |
| `REQUIREMENTS/number-game/difficulty.md` | Difficulty presets and ideas for later |
| `REQUIREMENTS/block-game/rules.md` | Board, slots, shapes, placing, line clearing, scoring, and game over |
| `REQUIREMENTS/disk-game/rules.md` | Pegs, disks, random layouts, moves, undo and hints, stages, move budget, scoring, and game over |
| `REQUIREMENTS/players-saves-scores.md` | Player IDs, server save slots, and high scores |
| `REQUIREMENTS/open-questions.md` | Open decisions, the chosen tech stack, and answered questions |

## Running With Docker

This is the easiest way to host the game. It needs Docker with the compose plugin.

1. Clone the repository and open its folder: `git clone <repository url> number-game` and then `cd number-game`.
2. Optional: copy `.env.example` to `.env` and change the settings. See Configuration below for what each one means with Docker.
3. Create the data folder and give it to user id 1000, which the server runs as inside the container: `mkdir -p data` and then `sudo chown 1000:1000 data`. Leave out `sudo` if you are already root. If you skip this step, Docker creates the folder owned by root and the server stops with an error saying the data folder is not writable.
4. Build and start the game: `docker compose up -d --build`.
5. Check that it is running: `docker compose ps` shows the container as healthy after a few seconds, and `docker compose logs` shows the server log.

To update, run `git pull` and then `docker compose up -d --build`. The database stays in the `data` folder on the host, so players, saves, and high scores survive updates and rebuilds. To back them up, stop the game with `docker compose stop`, copy the `data` folder, and start it again with `docker compose start`.

## Hosting on Proxmox

The game runs in either a VM or an LXC container. Both need a Linux system with Docker installed.

- VM: create a VM with any Linux system, such as Debian or Ubuntu. 1 CPU core, 1 GB of memory, and 8 GB of disk are plenty. Install Docker by following the Docker documentation for that system.
- LXC container: create a container from a Debian or Ubuntu template. Docker inside an LXC container needs nesting, so in the Proxmox web interface open the container, go to Options, then Features, and turn on nesting. Unprivileged containers also need keyctl turned on in the same place. Start the container and install Docker by following the Docker documentation for that system.

Then follow the steps in Running With Docker inside the VM or container.

Without Docker, install Node.js 24 or newer in the VM or container and follow the steps in Development below. Use `npm run build` and `npm start` to run the game.

## Playing From a Phone

The phone or laptop must be on the same network as the server.

1. Find the server address by running `hostname -I` inside the VM or container. The first address is usually the right one, such as `192.168.1.50`. It is also shown in the Proxmox web interface under the VM or container summary.
2. Open `http://<server address>:<PORT>` in the phone browser, such as `http://192.168.1.50:3000`.
3. Optional: add the page to the home screen from the browser menu so it opens like an app.

If the page does not load, check that the container is running with `docker compose ps`, that a firewall on the server or in Proxmox allows the port, and that the phone is not on a guest network that blocks other devices. Giving the server a fixed address in your router keeps the link from changing. If your router gives devices names, `http://<hostname>:<PORT>` works too.

## Development

Requires Node.js 24 or newer.

- `npm install` installs everything.
- `npm run build` builds every part, and `npm start` then starts the server. It reads settings from `.env` if that file exists. Open `http://<server address>:<PORT>` in a browser to play.
- `npm run dev -w @local/web` starts the Vite dev server for the browser app, which reloads on every change. Start the game server with `npm start` first, since the dev server sends `/api` calls to it on `PORT`.
- `npm run check` builds every part and runs type checks, lint, the format check, and the tests.
- `npm run format` fixes code formatting.

How the code is organised is described in `ARCHITECTURE.md`.

## Configuration

The server reads these settings from environment variables. Copy `.env.example` to `.env` to change them. A setting that is not set uses its default, and the server stops with a clear error if a value is invalid.

| Variable | Default | Meaning |
| --- | --- | --- |
| `HOST` | `0.0.0.0` | Network address the server listens on. `0.0.0.0` lets phones and laptops on the network connect |
| `PORT` | `3000` | Port the server listens on |
| `DATA_DIR` | `./data` | Folder where the SQLite database with players, saves, and high scores is stored |
| `SAVE_SLOTS_PER_GAME` | `10` | Number of save slots each game has |

With Docker, `compose.yaml` reads the same `.env` file, but some settings mean something slightly different:

| Variable | Meaning with Docker |
| --- | --- |
| `HOST` | Not used. Inside the container the server always listens on all addresses |
| `PORT` | Port on the host that the game is reachable on. Inside the container the server always uses port 3000 |
| `DATA_DIR` | Folder on the host that holds the database. It is mounted into the container as `/data` |
| `SAVE_SLOTS_PER_GAME` | Same as without Docker |

## Status

Phases 1 to 4 (project setup, game rules, server, and browser app) are done. In Phase 5, the Docker packaging and the setup steps are done, and the playtest on a phone and a laptop (T-41) is next. The Block Game (Phase 7) is built and needs its own playtest (T-55). The Disk Game (Phase 9) is built and needs its own playtest (T-61). The work plan is in `TASKS.md`.
