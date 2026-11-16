# Architecture

This file describes how the code is organised and how its parts talk to each other. The requirements behind these choices are in the `REQUIREMENTS/` folder.

## Parts

The repository is one npm workspace with these parts:

| Folder | Package | Job |
| --- | --- | --- |
| `packages/seeded-random` | `@local/seeded-random` | The seeded random number generator shared by the game rules packages. No browser or server code. See Randomness below |
| `packages/stored-values` | `@local/stored-values` | The checks every game uses when it reads a value back from storage, and the type of a stored format upgrade. No browser or server code |
| `packages/game-server-api` | `@local/game-server-api` | TypeBox schemas of every server request body and answer, shared by the server and the browser app |
| `packages/number-game` | `@local/number-game` | The Number Game rules as plain TypeScript. No browser or server code. Its files are listed in `packages/number-game/README.md` |
| `packages/block-game` | `@local/block-game` | The Block Game rules as plain TypeScript. No browser or server code. Its files are listed in `packages/block-game/README.md` |
| `packages/survivor-game` | `@local/survivor-game` | The Survivor Game rules as plain TypeScript, including the messages the browser and the server exchange over the WebSocket. No browser or server code. Its files are listed in `packages/survivor-game/README.md` |
| `apps/server` | `@local/server` | Fastify server. Stores players, saves, and high scores in SQLite, applies moves, keeps rooms and runs of room games in memory and steps them, and serves the built browser app |
| `apps/web` | `@local/web` | Svelte app built with Vite. Shows the dashboard and the games |

Dependencies only point one way: `apps/server` and `apps/web` both use the packages, the game rules packages use `packages/seeded-random` and `packages/stored-values`, and the packages use neither app. A rules package never uses another game's rules package. The browser and the server talk over HTTP, and during a run of a room game each player's browser also keeps one WebSocket open to the server (see Room Games).

## Adding a Game

A game is one of two kinds (PL-21). A saved game is played by one player in a save slot, one move at a time. A room game is played live by one to four players in a room, and has no save slots. Both kinds provide a rules package, a server module, a browser module, a requirements folder, and registrations. The server and browser registries hold both kinds in one list, and every module has a `kind` field (`'saved'` or `'room'`) that the registry looks at. The registry has one lookup for each kind, `getSavedGame` and `getRoomGame`, and the first one refuses a room game while the second refuses a saved game, both with status 400 and the error `wrong-game-kind`. A lookup of any kind with an unknown id is refused with 404 and `unknown-game`. The high score routes only need what both kinds share (the id, the categories, and reading summary details), so they use a plain `getGame` that accepts both.

Parts that both kinds provide:

- Requirements: a folder under `REQUIREMENTS/` named after the game.
- Registrations: the new package is added to the workspace list in the root `package.json`, which must stay in build order with dependencies first, and to the `Dockerfile`.
- High score parts: the id, the high score categories, the summary of a finished game as a score, a category, and details, a check that reads stored summary details back, and the upgrade list for older stored summary details.

Parts of a saved game:

- Rules package: a folder under `packages/` with a `README.md` that lists its files. It owns every fact the two apps must agree on: the game id, the game state type, the move type, one function that applies any move, the summary of a state for save slots and high scores, a check that reads stored states and summary details back, and the upgrade lists for older stored formats.
- Server module: registers the game with the server game registry. It adds the TypeBox schemas of the new game options and the moves, and checks when it compiles that the move schema matches the rules package move type. Everything else it passes on from the rules package. The shared save slot and move routes call it for the game named in the URL, so a game does not need routes of its own. The modules are `apps/server/src/games/number-game.ts` and `apps/server/src/games/block-game.ts`, and every game is listed in `apps/server/src/games/create-game-registry.ts`.
- Browser module: registers the game with the browser game registry under the id from the rules package. It gives the dashboard a name and a description, the high score categories, a way to label the summary details, and loaders for the new game options form and the play screen. The loaders use a dynamic `import()`, so a game's form and play screen are only downloaded the first time they are needed and the dashboard stays small as games are added. The modules are `apps/web/src/games/number-game/number-game-module.ts` and `apps/web/src/games/block-game/block-game-module.ts`, and every game is listed in `apps/web/src/games/create-browser-game-registry.ts`.

Parts of a room game:

- Rules package: the same layout as a saved game package, with a run state instead of a game state. The run state is plain data that survives JSON, because the server sends it to the browsers. It owns the game id, the run state type, one pure step function that takes the run state and the input of every player, the function that starts a run from a list of player IDs and a seed, the room limits (fewest and most players), the balance values, the message types of the WebSocket and the checks that read them, the step rate and the empty run time, how a refused input is reported, the function that ends a run that nobody is connected to, and the summary of a finished run. A run is never stored, so it has no stored state format.
- Server module: registers the game with the server game registry as a room game, by giving the shared room code a definition. `defineRoomGame` turns the definition into a registered game that starts a run session: an object that holds the run and the pending input of every player, and speaks in JSON text, so the shared code never sees the run type or the message types. The shared room code never looks inside the run state, and it owns the rooms, the routes, the WebSocket handling, and the step loop, so a room game does not need routes of its own. The module is `apps/server/src/games/survivor-game.ts`, and it is listed in `create-game-registry.ts` like the others. The definition is described in the table below.
- Browser module: registers the game with the browser game registry under the id from the rules package. It gives the dashboard a name and a description, the high score categories, a way to label the summary details, and one loader for the play screen. The game page of a room game shows the leaderboard and the room list in place of the save slots (PS-24), so the shared game page code does that and needs no loader for a new game form. The play screen is given the game id, the room id, the player ID, and the paths of the game page and the dashboard, which it links to when the run ends or the connection cannot come back. It opens its own WebSocket with the shared helpers that build the socket URL and reconnect, and checks every message with the check from the rules package. The module is `apps/web/src/games/survivor-game/survivor-game-module.ts`.

The definition a room game gives the server:

| Part | Job |
| --- | --- |
| `id`, `categories`, `minPlayers`, `maxPlayers`, `stepRate`, `stepsPerReport`, `emptyRunSeconds`, `socketPlayerIdParameter` | The facts the shared code needs, all taken from the rules package. `socketPlayerIdParameter` is `SOCKET_PLAYER_ID_PARAMETER` |
| `idleInput` | The pending input of a player who holds nothing, which is the start value and the value after a drop. For the Survivor Game it is `NO_INPUT` |
| `createRun(playerIds, seed)` | Starts a run |
| `parseClientMessage(raw)` | Checks a message from a browser and throws for a bad one. The shared code answers a frame that is not JSON, or that this check throws for, with a refusal of the reason `unreadable-message` |
| `applyClientMessage(run, playerId, pendingInput, message)` | Returns `{ accepted: true, pendingInput }` with the new pending input of that player, or `{ accepted: false, reason, message }`, a refusal made of a reason and a text. The pending input is the game's own input type. For the Survivor Game it is a `PlayerInput`: a direction message replaces the held direction, and an upgrade message is checked with `findUpgradeChoiceRefusal` and kept until the next step |
| `inputForNextStep(pendingInput)` | Returns what the player keeps holding after a step. For the Survivor Game it keeps the direction and drops the upgrade choice, so a choice reaches the step once |
| `step(run, pendingInputs)` | Calls the rules package step function with the pending input of every connected player. A dropped player is left out of the map, so the player stands still |
| `isRunOver(run)`, `endAsAbandoned(run)` | Whether the run ended, and ending a run that nobody is connected to |
| `summarize(run)`, `parseSummaryDetails`, `summaryDetailsUpgrades` | The result of a run for the high scores, and reading stored details back |
| `stateReport(run)`, `runEndedReport(run)`, `refusalReport(refusal)` | Build the messages sent to the browsers |

The dashboard, players, high scores, and the game page are shared code that works with any registered game through the game id. Shared code never contains rules for a specific game. (PL-04, PL-05, PL-06, PL-17, PL-21)

## How a Move Travels

The server is the source of truth for every saved game.

1. The browser opens the save named in the page link, by slot and save id, and receives the full game state.
2. The player makes a move, such as a match. The browser applies it right away with the rules package so the screen responds instantly.
3. The browser sends the move, not the new state, to the server.
4. The server checks that the slot still holds this save and that this device holds the lock, applies the same move to its stored state with the same rules package, and saves the result. It answers only whether the game is over, and the result that went into the high scores if it is.
5. If the server refuses the move, the browser shows the reason and offers to reload the server state. If the slot no longer holds this save, it offers the save slots and the dashboard instead. (PS-07, PS-08, PS-18, PS-19)

Because the server applies every move itself, a changed browser cannot save an impossible board or a fake high score.

## Room Games

A room game is run entirely by the server (SG-58). Browsers send only a direction and upgrade choices, and draw the state the server reports. The Survivor Game is the first room game.

### Rooms

Rooms live in memory on the server, so they are lost when the server restarts. A room has a random room id made with `crypto.randomUUID()`, a status of `waiting` or `running`, the player IDs in the order they joined, and a host, who is the first player in that list (SG-07). There is no sign in, since player IDs have no password (PS-02), so the routes trust the player ID in the body, and refuse one that is not a known player ID with 404 and `unknown-player`. A room is deleted when its last player leaves before the start (SG-07), when its run has ended and its sockets are closed, and when every member of a waiting room has expired (see Waiting Room Expiry).

The number of rooms that exist at once, whether waiting or running, is limited by the setting `MAX_ROOM_GAME_RUNS`, with a default of 4 (SG-09). It is shared by every room game, so one setting covers all of them. It must be a whole number from 1 to 1000, and it is read and documented like every other setting. A room that would go beyond it is refused with 409 and `too-many-runs`, and a message that says how many rooms are open. A waiting room counts as well, since it will become a run, so the host is never told "no" only at the start.

Every room route is under `/api/games/:gameId/rooms` and works only for a room game. The answers and bodies are TypeBox schemas in `@local/game-server-api`. A room in an answer has this shape:

| Field | Meaning |
| --- | --- |
| `roomId` | The room id |
| `status` | `waiting` or `running` |
| `hostPlayerId` | The player ID of the host |
| `playerIds` | Every player ID in the room, in the order they joined |
| `disconnectedPlayerIds` | The player IDs of a running room whose character has no connection. Always empty while waiting |
| `maxPlayers` | The most players the room takes |

| Method and path | Body | Answer | Errors |
| --- | --- | --- | --- |
| `GET /api/games/:gameId/rooms` | None | `{ "rooms": [room] }`. Every waiting room, and every running room that has a disconnected player so it can be rejoined (SG-05, SG-45) | |
| `POST /api/games/:gameId/rooms` | `{ "playerId" }` | 201 and `{ "room": room }`. The caller is the host and the only player | 409 `player-in-room`, 409 `too-many-runs` |
| `GET /api/games/:gameId/rooms/:roomId` | None. Optional query `playerId`, the player who asks | `{ "room": room }`. The room page polls it every second with its player ID, which notes that player as seen (see Waiting Room Expiry). A page with no player ID yet leaves the query out. The list of rooms does not note anyone | 404 `room-not-found`, 404 `unknown-player` |
| `POST /api/games/:gameId/rooms/:roomId/join` | `{ "playerId" }` | `{ "room": room }` | 404 `room-not-found`, 409 `room-started` (SG-06), 409 `room-full`, 409 `player-in-room` |
| `POST /api/games/:gameId/rooms/:roomId/leave` | `{ "playerId" }` | `{ "closed": boolean }`. `closed` is true when the room was deleted because nobody is left. A host who leaves hands the room to the player who joined next | 404 `room-not-found`, 404 `not-in-room`, 409 `room-started` |
| `POST /api/games/:gameId/rooms/:roomId/start` | `{ "playerId" }` | `{ "room": room }` with status `running`. The run is created with a random seed (picked by the server, like the seeds of the saved games), and the step loop starts | 404 `room-not-found`, 403 `not-host`, 409 `room-started`, 409 `not-enough-players` (fewer players than the game's `minPlayers`) |

A player ID is in at most one room at a time, counting waiting and running rooms (SG-05). `player-in-room` is the error for joining or creating a room while already in another one, or joining the same room twice. Joining a running room again is not a join: it is the rejoin below. Leaving a running room is not a route either: a player leaves a run by closing the page, which drops the player. A waiting room has no connection, so its members are tracked by the routes alone. A player leaves it by calling leave, which the browser does when the page is left, or by expiring.

### Waiting Room Expiry

A closed tab cannot call leave, so the store records when each member of a waiting room was last seen: when they create or join the room, and each time they read the room with their player ID. Every `WAITING_ROOM_SWEEP_INTERVAL_MS` (5 seconds), a timer removes the members who were not seen for `WAITING_ROOM_MEMBER_EXPIRY_MS` (30 seconds), through the same code as leave. The host passes to the next player who joined, and a room with nobody left is deleted, so it stops counting against `MAX_ROOM_GAME_RUNS` and its player IDs are free again. Running rooms never expire this way, since their players are tracked by their connections. The store reads its time from the injected `StepScheduler` clock, the timer runs on its scheduler, and the app stops it when it closes. All of these numbers are in `rooms/room-timing.ts`.

### WebSocket Connection

The path is `GET /api/games/:gameId/rooms/:roomId/socket?playerId=<player id>` with a WebSocket upgrade (PL-22). The room id and the player ID in the URL identify the player, and the query parameter name is `SOCKET_PLAYER_ID_PARAMETER` from the rules package. A connection that is refused is closed right after the upgrade with a close code and a short text:

| Close code | Meaning |
| --- | --- |
| 4400 | The room is still waiting, so there is no run to connect to |
| 4404 | The room does not exist (it may have ended), the game is not a room game, or the player ID is missing from the URL or not in the room |
| 4409 | That player ID already has a connection, which is never taken over (SG-45) |

A connection that is accepted can still be closed by the server:

| Close code | Meaning |
| --- | --- |
| 1000 | The run ended |
| 1001 | The server is shutting down |
| 1008 | The browser sent more than `SOCKET_MAX_FRAMES_PER_WINDOW` (120) frames within `SOCKET_FRAME_WINDOW_MS` (1 second), far more than a real player can. The player is dropped at once, and the browser does not reconnect, but stops and tells the player |
| 1011 | A run failed in a way its own handler could not recover from |

The server also checks that each connection is alive. Every `SOCKET_PING_INTERVAL_MS` (5 seconds) it sends a WebSocket ping to every connected socket, and terminates one that did not answer the ping before, or whose buffered outgoing bytes are more than `SOCKET_MAX_BUFFERED_BYTES` (1,000,000), so a phone that lost its Wi-Fi without closing cannot keep its player counted as connected, block a rejoin, keep an empty run alive (SG-47), or make the server queue reports without limit. A terminated socket closes like any dropped one (the browser sees 1006 and reconnects). The checks run on the injected `StepScheduler`, and the app stops them when it closes. Their numbers are in `rooms/room-timing.ts`.

Messages are JSON text frames of at most 4096 bytes, and each is one of the types in the rules package. Browsers check every message from the server with `parseServerMessage`, and the server checks every message from a browser with the game's `parseClientMessage`, so neither trusts the other.

| Direction | Message | Meaning |
| --- | --- | --- |
| Browser to server | `set-direction` with `direction` as `{ x, y }` or null | The direction the player holds now. The server keeps it for every step until the next message, so a message is only sent when it changes (SG-11). Each part must be a number from -1000 to 1000 (`MAX_DIRECTION_COMPONENT`), so a huge number is refused instead of overflowing, and a direction of zero length counts as no direction |
| Browser to server | `choose-upgrade` with `upgradeId` | The player's choice from the open offer. It is applied in the next step (SG-36) |
| Server to browser | `state` with `state` | A `RunStateReport`, described below. It is sent right after a connection opens, and then after every `STEPS_PER_STATE_REPORT` steps |
| Server to browser | `run-ended` with `reason`, `state`, and `summary` | The last state report and the result. The server then closes the socket normally (SG-48, SG-50) |
| Server to browser | `message-refused` with `reason` and `message` | A message was refused, for example a choice that is not in the offer, or a message that could not be read. The run and the connection go on |

The browser draws every `state` it receives and keeps no rules of its own, so the player's own character is found by player ID in the report.

A report is not the run state. A full run state with 4 players, 48 bullets, and 200 enemies is about 36 KB as JSON, which at 30 reports per second would be about 1 MB per second for each player. So `buildRunStateReport` in the rules package makes a `RunStateReport` with only what the browser reads: the step count, score, team health, level, experience, and upgrade counts, each player's ID, position, upgrade counts, open offer, and waiting offer count, and each bullet's and enemy's ID and position (and the radius of a bullet). It leaves out the random generator state, the spawn bookkeeping, the cooldowns, and the bullet details such as direction, damage, and hit lists. Positions are rounded to 1 decimal, and only in the report, since the server keeps the full precision state for its own steps. `STEPS_PER_STATE_REPORT` is 2, so the server reports 15 times per second. The same 4 player case is then about 9.5 KB per report, about 140 KB per second for each player. The browser checks a report with `parseRunStateReport`. A report cannot start a run, which is fine, since the server never reads one.

Dropping and rejoining (SG-44 to SG-47): when a socket closes for any reason, including one the server terminated or closed with 1008, the server marks the player as disconnected, resets the held direction to none, and keeps stepping, so the character stands still, keeps attacking, and gets offers that queue up. A browser that loses its connection tries to reconnect on its own with growing waits (SG-57). A player may connect again at any time from any device by picking the running room on the game page, which lists it in `disconnectedPlayerIds`, and using the same player ID. The first message after connecting is the current `state`, which contains the open offer and the queue count.

### The Step Loop

The server starts one loop for each running room at the start. The loop steps the run `stepRate` times per second, with a timer that is corrected against a monotonic clock (`performance.now()`) so the rate does not drift. If a tick comes late, the loop does up to a few steps to catch up and then carries on, so a slow moment can never grow into an endless backlog. In each step the loop:

1. Builds the pending input of every connected player, and leaves the dropped players out.
2. Calls the module `step` and replaces the run, then replaces each pending input with `inputForNextStep`.
3. Sends a `state` message to every connected player when the step number is a multiple of `stepsPerReport`.
4. Counts the steps with no player connected. At `emptyRunSeconds` times `stepRate` of them in a row, it calls `endAsAbandoned` (SG-47). Any connection resets the count.
5. When `isRunOver` is true, stores the result, sends `run-ended`, closes the sockets, stops the loop, and deletes the room.

A choice that is in the offer when the message arrives can still be taken out of it by another player's choice before the step (SG-43). The step skips such a choice and the player sees the changed offer in the next `state`. A step that fails with an error not listed in the rules package README is a bug: the server logs it, ends the run with `endAsAbandoned` (which stores the result and sends `run-ended` like any other end), and stops its loop, so one broken run cannot stop the others. The same goes for an error while handling a message. If a result cannot be stored, the server logs that and still ends the run.

The loop takes its clock and timer from a `StepScheduler`, so tests move time by hand, and so do the connection checks and the room expiry. The server stops every loop, the connection checks, and the room expiry timer, and closes every socket with code 1001, when the app closes.

### High Scores With Several Players

A result of a room game names every player on the team (PS-23). The `high_scores` table keeps the score, category, details, and time of a result, and a new table `high_score_players` with the columns `high_score_id`, `player_id`, and `position` says who was on it, with one row for each player in the order they joined. A database migration creates the table, copies the player of every existing result into it, and rebuilds `high_scores` without its `player_id` column, so there is one source for who is on a result and the old column cannot go out of date. The store writes a result and its player rows in one savepoint, so they are written together inside or outside another transaction, when a run ends, whether it ended in defeat or was abandoned (SG-49).

The answers change for every game, since a saved game result is simply a result with one player: a result in `GET /api/games/:gameId/high-scores` and in the personal bests answer has `playerIds`, a list of one or more player IDs, in place of `playerId`. The `result` in the answer of a move that ended a saved game has the same shape, with one player ID. The personal bests route for a player looks at the results that player is on, so one team score counts for every member, and still answers with the best result per category. The leaderboard shows every name of a result. Category filtering, the limit, and the order (best score first, earlier first on a tie) are unchanged.

## Randomness

New boards, Add Numbers, and Block Game shapes use a seeded random number generator whose state is part of the game state. The server picks a random seed when it starts a new game, so the rules package itself has no hidden randomness. Since the browser and the server start from the same state, they produce the same numbers for the same move. A save loaded on another device continues with exactly the same upcoming numbers.

## Storage

The server stores everything in one SQLite file inside `DATA_DIR`. Tables are created and upgraded by migrations that run when the server starts. (PS-03, PS-13)

Each save row has a random save id, made with `crypto.randomUUID()` when a game starts. A slot holds many games one after another, so the save id is what tells them apart. The migration that added it gave every save that already existed its own random id. (PS-19)

Game states and high score summary details are stored as JSON, each with the format version of the game that wrote it. Before the server uses one, it runs the game's upgrades from the stored version to the newest, then checks it with the rules package. This works like the database migrations, but each game keeps its own list. A game that is removed from the dashboard gets a database migration that deletes its saves and high scores, since no code is left to read them. A stored format newer than the server knows, or one that fails the check, is refused with the error `broken-save` or `broken-high-score` instead of being loaded. The server does not write the upgraded state back on its own. The next move saves it in the newest format.

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
| `database/` | Opening the SQLite file, migrations, and one store per table. The high score store covers `high_scores` and `high_score_players` |
| `games/` | The game registry for both kinds of game, the stored format upgrade runner, `room-game.ts` with the room game definition, and each game's server module |
| `rooms/` | Shared by every room game. `room-store.ts` is the in-memory room list and its rules, `step-loop.ts` is the loop with its `StepScheduler`, `room-runner.ts` steps every running room and connects, drops, and ends its players, `room-socket.ts` is the small socket type and the close codes, `room-timing.ts` holds every interval and limit of the connection checks and the room expiry, `repeating-timer.ts` repeats a call on the scheduler, `socket-watchdog.ts` pings sockets and terminates stalled ones, `frame-rate-limit.ts` counts the frames of a socket, and `waiting-room-expiry.ts` starts the timer that removes members who were not seen |
| `routes/` | One file per group of routes, plus `request-lookups.ts` for the game, slot, save, and player lookups that several routes start with. The room routes (`room-routes.ts`) and the WebSocket route (`room-socket-routes.ts`) are here too |
| `test-support.ts` | Test server, save builders, and the `ManualScheduler` that moves time by hand for the tests. Left out of the build |
| `counter-test-game.ts` and `fake-room-test-game.ts` | A tiny saved game and a tiny room game used by the tests of shared code, so they do not depend on the rules of a real game. Left out of the build |

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
| `GET /api/games/:gameId/high-scores` | Top results. Optional `category` (such as the difficulty) and `limit`. Works for both kinds of game |
| `GET /api/games/:gameId/personal-bests/:playerId` | A player's best result per category. Works for both kinds of game |
| `/api/games/:gameId/rooms` routes and the WebSocket at `/api/games/:gameId/rooms/:roomId/socket` | List, create, read, join, leave, and start rooms of a room game, and connect to its run. Described under Room Games |

The slot, move, and room routes each work only for their own kind of game, and refuse the other kind with 400 and `wrong-game-kind`. The slot list, the start answer, and the open answer all carry the save id. Open, move, and delete name the save in the URL. If the slot is empty or holds a different save, they are refused with status 410 and the error `save-gone`, and nothing changes. This check comes before the lock check, so a stale page is never offered to take the lock of a newer game. (PS-19, PS-21)

Requests that start, open, or change a save must send an `x-device-id` header. The browser makes up a random device ID once and keeps it. Opening a save moves its lock to that device, and moves from any other device are refused with the error `opened-elsewhere`. (PS-18)

High scores store a `category` used for filtering and a `details` object shown next to the score, and name one or more player IDs (see Room Games). For the Number Game, the category is the difficulty, and the details are the stage and difficulty. For the Block Game, every result is in one category, and the details are the lines cleared. For the Survivor Game, the category is the number of players, and the details are the time survived and the level reached. (SG-49)

Paths outside `/api/` serve the built browser app from `apps/web/dist`, and unknown pages get its `index.html` so the browser app can handle its own page routing. If the browser app has not been built, the server logs a warning and serves only the API.

## Browser App

`apps/web/src` is laid out by job:

| Path | Job |
| --- | --- |
| `main.ts` and `App.svelte` | Start the app, show the header with the dashboard link, and pick the page for the current URL |
| `app.css` | Shared look of every page, built for phone portrait screens first |
| `routing/` | Page paths and page routing with the browser history |
| `api/` | One function per server route, with the room routes in `room-api.ts`. Every answer is checked with the shared schemas from `@local/game-server-api` before it is used |
| `api/device-id.ts` | The random device ID kept in local storage and sent in the `x-device-id` header |
| `saving/move-sync.ts` | Sends moves to the server one at a time and in order, retries failed saves, and stops when the save was opened elsewhere or is gone |
| `games/` | The browser game registry for both kinds of game, each game's browser module in its own folder, and `board-position.ts`, the row and column type the board effects share. The module type is `SavedBrowserGame` or `RoomBrowserGame`, told apart by `kind`, and the pages narrow on it |
| `rooms/` | Shared by every room game. `poller.ts` loads the room list and the waiting room again and again, `room-entry.ts` decides what the room page shows for a room and a player ID, `room-socket-url.ts` builds the WebSocket address, and `reconnecting-socket.ts` is the socket that reconnects with growing waits and stops on a close that cannot recover (SG-57). It carries text only, so it never sees a game's messages |
| `audio/` | The shared sound player and `bell-tones.ts`, the bell that the games build their chimes from. The player plays tones made in the browser and recorded clips (bundled mp3 files with their credits in `audio/clips/CREDITS.md`, fetched once, decoded once, and preloaded by each play screen), and keeps the mute choice from the header button in local storage (PL-18, PL-19) |
| `test-support/` | Helpers for the tests, such as a local storage kept in memory. Only tests use them |
| `pages/` | One Svelte component per page: dashboard, game, play, room, outdated play link, and not found |
| `components/` | Pieces of pages: the sound mute button, the game leaderboard, the save slot list, the new game setup, the player ID picker, the save status banner, the save gone notice, the top results table, and the personal bests list, and the room list of a room game. Also the pieces every play screen shares: the status bar, the game over panel, and the points pop-up that floats up from a board cell |

Pages and their paths:

| Path | Page |
| --- | --- |
| `/` | Dashboard with every registered game |
| `/games/:gameId` | Game page with the leaderboard. For a saved game it also shows the save slots: a used slot continues or deletes its game, and an empty slot asks for a player ID and the game's options on the same page, then starts a new game (PS-22). For a room game it shows the list of rooms in place of the save slots, which refreshes every few seconds, with a way to create a room and to join one with a picked player ID, and a rejoin button for each dropped player of a running room (PS-24) |
| `/games/:gameId/rooms/:roomId` | Room game pages. While the room is waiting it shows the waiting room, with the players, a way to leave, and a start button for the host. When the run starts, or when a player rejoins a running room, it shows the game's play screen with the WebSocket (PL-22). The player ID is the query parameter `playerId` of the page link, so reloading the page rejoins the run. A link without it asks for a player ID first, and a player who is not in a waiting room sees a join button. Leaving the waiting room page through a link in the app leaves the room. Closing the tab cannot, so the page polls the room every second with its player ID, and the server removes a player who stopped polling for about 30 seconds (see Waiting Room Expiry) |
| `/games/:gameId/new`, `/games/:gameId/load`, and `/games/:gameId/high-scores` | Paths of pages that are now part of the game page. They open the game page, so old links and bookmarks still work |
| `/games/:gameId/slots/:slotNumber/saves/:saveId` | Opens the save and shows the game's play screen |
| `/games/:gameId/slots/:slotNumber` | An older play link without a save id. It opens no game and links to the save slots and the dashboard (PS-20) |
| Any other path | Not found page with a link to the dashboard |

The play page of a saved game loads the save and hands its state to the game's play screen. The play screen applies each move with the rules package, then hands the move to the move sync. Network errors and server errors are retried with growing waits, and the save status banner tells the player while that happens. A move the server refuses, or a save that was opened on another device, stops saving and offers to reload the game from the server. A save that is gone, because the game ended, was deleted, or a new game took the slot, stops saving too. Then the page offers the save slots and the dashboard, never a reload, and reloading the page shows the same message. A finished game still shows its game over panel, since the last move was saved before the slot was emptied. Leaving the page while moves are still unsaved shows the browser's leave warning. Leaving through a link inside the app shows no warning, so the move sync still sends the moves that are queued, without retrying a send that fails. (PS-07, PS-08, PS-18, PS-19)

The play screen of a room game is not given a state to start from. It opens its own connection, and everything it draws comes from the states the server reports (SG-58). The Survivor Game play screen, `SurvivorGamePlayScreen.svelte`, keeps its Svelte parts thin: the status display, the offer cards, and the connection notice are small components, and the rest is plain TypeScript with tests next to it, in `apps/web/src/games/survivor-game/`:

| File | Job |
| --- | --- |
| `run-connection.ts` | The reconnecting socket plus the rules package checks of every server message, and the two messages a browser sends. It stops with a notice on a message it cannot read or a state without the player's character |
| `state-timeline.ts` and `scene.ts` | Keep the last two states and slide every circle between them, since the server reports 15 times per second and the screen draws more often. Each slide lasts as many steps of time as the gap between the two states, so a report every second step slides over two steps. A jump of more than 4 steps, such as after a reconnect, is drawn as it is |
| `view-transform.ts` | World to screen: the same arena on every device, with bars on a very long screen (SB-09), and the grid lines that scroll with the world |
| `visible-ropes.ts` | The pairs of players far enough apart to draw their rope (SG-19) |
| `draw-scene.ts` | Draws a frame on the canvas as simple shapes (SG-53). It is the only file that draws |
| `direction.ts`, `joystick.ts`, and `direction-sender.ts` | The direction from the keys and from the joystick, cut to 32 directions with a dead zone, and the sender that sends a `set-direction` message only when the direction changes and sends it again after a reconnect, since the server forgets it (SG-54) |
| `play-input.ts` and `lock-page-gestures.ts` | Read keyboard and pointer events, let go of everything when the page loses focus, and stop the page from scrolling or zooming |
| `offer-cards.ts` | The cards of the open offer with their effect texts, the keys 1 to 3, and the guard that stops a second tap from choosing twice, and lets go whenever the connection is not open, since a choice sent as it dropped may never have been applied (SG-55) |
| `run-status.ts` | The health bar, experience bar, level, score, and time survived (SG-56) |

The play screen fills the whole window. It has a tall arrangement, with the status on top and the offer cards in a row at the top edge of the arena, and a wide arrangement, with the status in a column on the left and the cards in a column at the right edge (SG-51, SG-55). The cards are not inside the element that listens for touches, so a touch on a card never starts the joystick. When the run ends, the shared game over panel is shown over the last picture (SG-50).

The Number Game play screen still calls the single rules (`applyMatch`, `applyAddNumbers`, `applyHint`) instead of `applyMove`, because it needs what only they return, such as whether a stage was cleared and which pair a hint shows. The moves it sends use the `NumberGameMove` type from the rules package.

Sounds and effects only show what happened and never change the game state. Each play screen picks the sound for an event, including game over, from its game's sounds file (`number-game-sounds.ts` or `block-game-sounds.ts`) and plays it with the shared sound player. After a match it also hands the board a short-lived match effect: a burst on both cleared cells, and the points earned with the Chinese words of the cheer beside them, placed with the cell positions from before the move. The Block Game play screen does the same after a line clear, with a flash on the cleared cells. (NG-30, NG-31, BG-17, BG-18, PL-18)

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
| Vite | Builds the browser app and runs its dev server, which sends `/api` calls, WebSocket upgrades included, to the server on `PORT` |
| svelte-check | Type checks the Svelte components with the same strict settings |
| Docker | Packages the server and the built browser app into one image, run with docker compose |

`npm run check` builds every part, then runs type checks, lint, the format check, and the tests.

The server and the browser app use the built `dist` folder of each package, not its source. After changing a package, run `npm run build` before type checking the apps, or just run `npm run check`.

## Test Coverage

The rules packages, the server, and the browser app's routing, server calls, saving, and game logic helpers have tests. The Svelte components do not.
