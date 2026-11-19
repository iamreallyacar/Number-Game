# Server

This folder is the Fastify server, `@local/server`. It stores players, saves, and high scores in SQLite, applies moves with the rules packages, keeps rooms and runs of room games in memory and steps them, and serves the built browser app. The routes are in `API.md`, the settings are in `GUIDE.md`, and where the server sits among the other parts is in `ARCHITECTURE.md`.

## Files

`src` is laid out by job:

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

## Rooms

Rooms live in memory, so they are lost when the server restarts. A room has a random room id made with `crypto.randomUUID()`, a status of `waiting` or `running`, the player IDs in the order they joined, and a host, who is the first player in that list (SG-07). A room is deleted when its last player leaves before the start (SG-07), when its run has ended and its sockets are closed, and when every member of a waiting room has expired.

## Waiting room expiry

A closed tab cannot call leave, so the store records when each member of a waiting room was last seen: when they create or join the room, and each time they read the room with their player ID. Every `WAITING_ROOM_SWEEP_INTERVAL_MS` (5 seconds), a timer removes the members who were not seen for `WAITING_ROOM_MEMBER_EXPIRY_MS` (30 seconds), through the same code as leave. The host passes to the next player who joined, and a room with nobody left is deleted, so it stops counting against `MAX_ROOM_GAME_RUNS` and its player IDs are free again. Running rooms never expire this way, since their players are tracked by their connections. The store reads its time from the injected `StepScheduler` clock, the timer runs on its scheduler, and the app stops it when it closes. All of these numbers are in `rooms/room-timing.ts`. (SG-61)

## Connection checks

The server also checks that each connection is alive. Every `SOCKET_PING_INTERVAL_MS` (5 seconds) it sends a WebSocket ping to every connected socket, and terminates one that did not answer the ping before, or whose buffered outgoing bytes are more than `SOCKET_MAX_BUFFERED_BYTES` (1,000,000), so a phone that lost its Wi-Fi without closing cannot keep its player counted as connected, block a rejoin, keep an empty run alive (SG-47), or make the server queue reports without limit. A terminated socket closes like any dropped one (the browser sees 1006 and reconnects). The checks run on the injected `StepScheduler`, and the app stops them when it closes. Their numbers are in `rooms/room-timing.ts`.

The browser's side of the frame limit and the close codes are in `API.md`.

## The step loop

The server starts one loop for each running room at the start. The loop steps the run `stepRate` times per second, with a timer that is corrected against a monotonic clock (`performance.now()`) so the rate does not drift. If a tick comes late, the loop does up to a few steps to catch up and then carries on, so a slow moment can never grow into an endless backlog. In each step the loop:

1. Builds the pending input of every connected player, and leaves the dropped players out.
2. Calls the module `step` and replaces the run, then replaces each pending input with `inputForNextStep`.
3. Sends a `state` message to every connected player when the step number is a multiple of `stepsPerReport`.
4. Counts the steps with no player connected. At `emptyRunSeconds` times `stepRate` of them in a row, it calls `endAsAbandoned` (SG-47). Any connection resets the count.
5. When `isRunOver` is true, stores the result, sends `run-ended`, closes the sockets, stops the loop, and deletes the room.

A choice that is in the offer when the message arrives can still be taken out of it by another player's choice before the step (SG-43). The step skips such a choice and the player sees the changed offer in the next `state`. A step that fails with an error not listed in the rules package README is a bug: the server logs it, ends the run with `endAsAbandoned` (which stores the result and sends `run-ended` like any other end), and stops its loop, so one broken run cannot stop the others. The same goes for an error while handling a message. If a result cannot be stored, the server logs that and still ends the run.

The loop takes its clock and timer from a `StepScheduler`, so tests move time by hand, and so do the connection checks and the room expiry. The server stops every loop, the connection checks, and the room expiry timer, and closes every socket with code 1001, when the app closes.

## Reports

The server sends a cut down `RunStateReport` instead of the run state, because a full run state with 4 players, 48 bullets, and 200 enemies is about 36 KB as JSON, which at 30 reports per second would be about 1 MB per second for each player. With the cut down report and 15 reports per second, the same case is about 9.5 KB per report, about 140 KB per second for each player. What a report holds is in `API.md`.

## High scores with several players

A result of a room game names every player on the team (PS-23). The `high_scores` table keeps the score, category, details, and time of a result, and a new table `high_score_players` with the columns `high_score_id`, `player_id`, and `position` says who was on it, with one row for each player in the order they joined. A database migration creates the table, copies the player of every existing result into it, and rebuilds `high_scores` without its `player_id` column, so there is one source for who is on a result and the old column cannot go out of date. The store writes a result and its player rows in one savepoint, so they are written together inside or outside another transaction, when a run ends, whether it ended in defeat or was abandoned (SG-49).

## Storage

The server stores everything in one SQLite file inside `DATA_DIR`. Tables are created and upgraded by migrations that run when the server starts. (PS-03, PS-13)

Each save row has a random save id, made with `crypto.randomUUID()` when a game starts. A slot holds many games one after another, so the save id is what tells them apart. The migration that added it gave every save that already existed its own random id. (PS-19) Each save row also has a `move_count`, the number of moves applied to it. The move route applies a move only when its move number equals the count, and stores the count plus one in the same update as the new state, so a move that is sent again after a lost answer is not applied twice (PS-07).

Game states and high score summary details are stored as JSON, each with the format version of the game that wrote it. Before the server uses one, it runs the game's upgrades from the stored version to the newest, then checks it with the rules package. This works like the database migrations, but each game keeps its own list. A game that is removed from the dashboard gets a database migration that deletes its saves and high scores, since no code is left to read them. A stored format newer than the server knows, or one that fails the check, is refused instead of being loaded, with the errors listed in `API.md`. The server does not write the upgraded state back on its own. The next move saves it in the newest format.
