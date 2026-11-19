# API

This file holds the interfaces of the server: routes, messages, answer shapes, the error format, and the conventions they follow. The request and answer schemas are TypeBox schemas in `packages/game-server-api` (`src/index.ts` lists them), shared by the server and the browser app. How the server works inside is described in `apps/server/README.md`.

## Conventions

- Error shape: every error response has the shape `{ "error": "<code>", "message": "<text>" }`. A refused move also has a `reason` field, such as `not-a-pair`.
- Game lookup: a lookup with an unknown game id is refused with 404 and `unknown-game`. The slot, move, and room routes each work only for their own kind of game, and refuse the other kind with 400 and `wrong-game-kind`. The high score routes work for both kinds. (PL-21)
- Save id: the slot list, the start answer, and the open answer all carry the save id. Open, move, and delete name the save in the URL. If the slot is empty or holds a different save, they are refused with status 410 and the error `save-gone`, and nothing changes. This check comes before the lock check, so a stale page is never offered to take the lock of a newer game. (PS-19, PS-21)
- Device ID: requests that start, open, or make a move in a save must send an `x-device-id` header. The browser makes up a random device ID once and keeps it. Opening a save moves its lock to that device, and moves from any other device are refused with the error `opened-elsewhere`. Delete sends no device ID and ignores the lock. (PS-18)
- Stored formats: a stored game state or high score detail that is newer than the server knows, or fails its check, is refused with the error `broken-save` or `broken-high-score`.
- Player IDs in room routes: there is no sign in, since player IDs have no password (PS-02), so the routes trust the player ID in the body, and refuse one that is not a known player ID with 404 and `unknown-player`.
- Static files: paths outside `/api/` serve the built browser app from `apps/web/dist`, and unknown pages get its `index.html` so the browser app can handle its own page routing. If the browser app has not been built, the server logs a warning and serves only the API.

## Routes

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
| `/api/games/:gameId/rooms` routes and the WebSocket at `/api/games/:gameId/rooms/:roomId/socket` | List, create, read, join, leave, and start rooms of a room game, and connect to its run. Described under Room routes and WebSocket connection |

## High scores

High scores store a `category` used for filtering and a `details` object shown next to the score, and name one or more player IDs. For the Number Game, the category is the difficulty, and the details are the stage and difficulty. For the Block Game, every result is in one category, and the details are the lines cleared. For the Survivor Game, the category is the number of players, and the details are the time survived and the level reached. (SG-49)

A saved game result is simply a result with one player. A result in `GET /api/games/:gameId/high-scores` and in the personal bests answer has `playerIds`, a list of one or more player IDs, in place of `playerId`. The `result` in the answer of a move that ended a saved game has the same shape, with one player ID. The personal bests route for a player looks at the results that player is on, so one team score counts for every member, and still answers with the best result per category. The leaderboard shows every name of a result. Category filtering, the limit, and the order (best score first, earlier first on a tie) are unchanged. (PS-23)

## Room routes

Every room route is under `/api/games/:gameId/rooms` and works only for a room game. A room in an answer has this shape:

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
| `GET /api/games/:gameId/rooms/:roomId` | None. Optional query `playerId`, the player who asks | `{ "room": room }`. The room page polls it every second with its player ID, which notes that player as seen (see `apps/server/README.md`). A page with no player ID yet leaves the query out. The list of rooms does not note anyone | 404 `room-not-found`, 404 `unknown-player` |
| `POST /api/games/:gameId/rooms/:roomId/join` | `{ "playerId" }` | `{ "room": room }` | 404 `room-not-found`, 409 `room-started` (SG-06), 409 `room-full`, 409 `player-in-room` |
| `POST /api/games/:gameId/rooms/:roomId/leave` | `{ "playerId" }` | `{ "closed": boolean }`. `closed` is true when the room was deleted because nobody is left. A host who leaves hands the room to the player who joined next | 404 `room-not-found`, 404 `not-in-room`, 409 `room-started` |
| `POST /api/games/:gameId/rooms/:roomId/start` | `{ "playerId" }` | `{ "room": room }` with status `running`. The run is created with a random seed (picked by the server, like the seeds of the saved games), and the step loop starts | 404 `room-not-found`, 403 `not-host`, 409 `room-started`, 409 `not-enough-players` (fewer players than the game's `minPlayers`) |

A player ID is in at most one room at a time, counting waiting and running rooms (SG-05). `player-in-room` is the error for joining or creating a room while already in another one, or joining the same room twice. Joining a running room again is not a join: it is the rejoin described under Dropping and rejoining. Leaving a running room is not a route either: a player leaves a run by closing the page, which drops the player. A waiting room has no connection, so its members are tracked by the routes alone. A player leaves it by calling leave, which the browser does when the page is left, or by expiring (SG-61, see `apps/server/README.md`).

The number of rooms that exist at once is limited by `MAX_ROOM_GAME_RUNS` (SG-09, see `GUIDE.md`). A room that would go beyond it is refused with 409 and `too-many-runs`, and a message that says how many rooms are open. A waiting room counts as well, since it will become a run.

## WebSocket connection

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

The server also pings every connected socket and terminates one that stops answering or falls behind, which the browser sees as 1006 and reconnects. The intervals and limits are in `apps/server/src/rooms/room-timing.ts`, and how the checks work is in `apps/server/README.md`.

## Messages

Messages are JSON text frames of at most 4096 bytes, and each is one of the types in the rules package. Browsers check every message from the server with `parseServerMessage`, and the server checks every message from a browser with the game's `parseClientMessage`, so neither trusts the other.

| Direction | Message | Meaning |
| --- | --- | --- |
| Browser to server | `set-direction` with `direction` as `{ x, y }` or null | The direction the player holds now. The server keeps it for every step until the next message, so a message is only sent when it changes (SG-11). Each part must be a number from -1000 to 1000 (`MAX_DIRECTION_COMPONENT`), so a huge number is refused instead of overflowing, and a direction of zero length counts as no direction |
| Browser to server | `choose-upgrade` with `upgradeId` | The player's choice from the open offer. It is applied in the next step (SG-36) |
| Server to browser | `state` with `state` | A `RunStateReport`, described below. It is sent right after a connection opens, and then after every `STEPS_PER_STATE_REPORT` steps |
| Server to browser | `run-ended` with `reason`, `state`, and `summary` | The last state report and the result. The server then closes the socket normally (SG-48, SG-50) |
| Server to browser | `message-refused` with `reason` and `message` | A message was refused, for example a choice that is not in the offer, or a message that could not be read. The run and the connection go on |

The browser draws every `state` it receives and keeps no rules of its own, so the player's own character is found by player ID in the report.

## RunStateReport

A report is not the run state. `buildRunStateReport` in the rules package makes a `RunStateReport` with only what the browser reads: the step count, score, team health, level, experience, and upgrade counts, each player's ID, position, upgrade counts, open offer, and waiting offer count, and each bullet's and enemy's ID and position (and the radius of a bullet). It leaves out the random generator state, the spawn bookkeeping, the cooldowns, and the bullet details such as direction, damage, and hit lists. Positions are rounded to 1 decimal, and only in the report, since the server keeps the full precision state for its own steps. `STEPS_PER_STATE_REPORT` is 2, so the server reports 15 times per second. The browser checks a report with `parseRunStateReport`. A report cannot start a run, which is fine, since the server never reads one. Why reports are cut down is in `apps/server/README.md`.

## Dropping and rejoining

When a socket closes for any reason, including one the server terminated or closed with 1008, the server marks the player as disconnected, resets the held direction to none, and keeps stepping, so the character stands still, keeps attacking, and gets offers that queue up. A browser that loses its connection tries to reconnect on its own with growing waits (SG-57). A player may connect again at any time from any device by picking the running room on the game page, which lists it in `disconnectedPlayerIds`, and using the same player ID. The first message after connecting is the current `state`, which contains the open offer and the queue count. (SG-44 to SG-47)
