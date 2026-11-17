# Guide

## User setup

### Running with Docker

This is the easiest way to host the game. It needs Docker with the compose plugin.

1. Clone the repository and open its folder: `git clone <repository url> number-game` and then `cd number-game`.
2. Optional: copy `.env.example` to `.env` and change the settings. See Configuration below for what each one means with Docker.
3. Create the data folder and give it to user id 1000, which the server runs as inside the container: `mkdir -p data` and then `sudo chown 1000:1000 data`. Leave out `sudo` if you are already root. If you skip this step, Docker creates the folder owned by root and the server stops with an error saying the data folder is not writable.
4. Build and start the game: `docker compose up -d --build`.
5. Check that it is running: `docker compose ps` shows the container as healthy after a few seconds, and `docker compose logs` shows the server log.

To update, run `git pull` and then `docker compose up -d --build`. The database stays in the `data` folder on the host, so players, saves, and high scores survive updates and rebuilds. To back them up, stop the game with `docker compose stop`, copy the `data` folder, and start it again with `docker compose start`.

### Hosting on Proxmox

The game runs in either a VM or an LXC container. Both need a Linux system with Docker installed.

- VM: create a VM with any Linux system, such as Debian or Ubuntu. 1 CPU core, 1 GB of memory, and 8 GB of disk are plenty. Install Docker by following the Docker documentation for that system.
- LXC container: create a container from a Debian or Ubuntu template. Docker inside an LXC container needs nesting, so in the Proxmox web interface open the container, go to Options, then Features, and turn on nesting. Unprivileged containers also need keyctl turned on in the same place. Start the container and install Docker by following the Docker documentation for that system.

Then follow the steps in Running with Docker inside the VM or container.

Without Docker, install Node.js 24 or newer in the VM or container and follow the steps in Developer setup below. Use `npm run build` and `npm start` to run the game.

### Playing from a phone

The phone or laptop must be on the same network as the server. In the Survivor Game, every player joins the same server from their own device.

1. Find the server address by running `hostname -I` inside the VM or container. The first address is usually the right one, such as `192.168.1.50`. It is also shown in the Proxmox web interface under the VM or container summary.
2. Open `http://<server address>:<PORT>` in the phone browser, such as `http://192.168.1.50:3000`.
3. Optional: add the page to the home screen from the browser menu so it opens like an app.

If the page does not load, check that the container is running with `docker compose ps`, that a firewall on the server or in Proxmox allows the port, and that the phone is not on a guest network that blocks other devices. Giving the server a fixed address in your router keeps the link from changing. If your router gives devices names, `http://<hostname>:<PORT>` works too.

### Configuration

The server reads these settings from environment variables. Copy `.env.example` to `.env` to change them. A setting that is not set uses its default, and the server stops with a clear error if a value is invalid.

| Variable | Default | Meaning |
| --- | --- | --- |
| `HOST` | `0.0.0.0` | Network address the server listens on. `0.0.0.0` lets phones and laptops on the network connect |
| `PORT` | `3000` | Port the server listens on |
| `DATA_DIR` | `./data` | Folder where the SQLite database with players, saves, and high scores is stored |
| `SAVE_SLOTS_PER_GAME` | `10` | Number of save slots each game has. If it is lowered, saves in the slots above the new number are kept but cannot be reached until it is raised again |
| `MAX_ROOM_GAME_RUNS` | `4` | Most rooms of room games, from 1 to 1000, that exist at once, counting waiting rooms and runs in progress, shared by every room game. Each run is stepped many times a second, so raise it only as far as the server machine can keep up |

With Docker, `compose.yaml` reads the same `.env` file, but some settings mean something slightly different:

| Variable | Meaning with Docker |
| --- | --- |
| `HOST` | Not used. Inside the container the server always listens on all addresses |
| `PORT` | Port on the host that the game is reachable on. Inside the container the server always uses port 3000 |
| `DATA_DIR` | Folder on the host that holds the database. It is mounted into the container as `/data` |
| `SAVE_SLOTS_PER_GAME` | Same as without Docker |
| `MAX_ROOM_GAME_RUNS` | Same as without Docker |

## Developer setup

Requires Node.js 24 or newer.

- `npm install` installs everything.
- `npm run build` builds every part, and `npm start` then starts the server. It reads settings from `.env` if that file exists. Open `http://<server address>:<PORT>` in a browser to play.
- `npm run dev -w @local/web` starts the Vite dev server for the browser app, which reloads on every change. Start the game server with `npm start` first, since the dev server sends `/api` calls to it on `PORT`.
- `npm run check` builds every part and runs type checks, lint, the format check, and the tests.
- `npm run format` fixes code formatting.

### Tools

| Tool | Use |
| --- | --- |
| TypeScript | Strict type checking with the shared settings in `tsconfig.base.json` |
| ESLint | Strict type-aware lint rules from `typescript-eslint` |
| Prettier | Code formatting. Markdown files are skipped because they follow the documentation style guide in `CLAUDE.md` |
| TypeBox | The shared request and answer schemas. They check server requests and give route handlers their types, and the browser app uses them to check server answers |
| Vite | Builds the browser app and runs its dev server, which sends `/api` calls, WebSocket upgrades included, to the server on `PORT` |
| svelte-check | Type checks the Svelte components with the same strict settings |
| Docker | Packages the server and the built browser app into one image, run with docker compose |

The test tools are described in `TESTING.md`. The server and the browser app use the built `dist` folder of each package, not its source. After changing a package, run `npm run build` before type checking the apps, or just run `npm run check`.

### Packaging

The `Dockerfile` builds the image in two stages. The first installs every dependency and runs `npm run build`. The second keeps only the built `dist` folders and the dependencies needed at run time, and runs the server as the unprivileged `node` user (user id 1000). Inside the container the server always uses `HOST=0.0.0.0`, `PORT=3000`, and `DATA_DIR=/data`. A health check calls `/api/health`.

`compose.yaml` maps the host `PORT` to port 3000, mounts the host `DATA_DIR` folder as `/data` so the database survives rebuilds, and passes the rest of `.env` to the server. The data folder must be writable by user id 1000. Before opening the database, the server checks that its data folder is writable and stops with an error naming the folder if it is not. (PL-14, PL-15)

The code is organised as described in `ARCHITECTURE.md`.
