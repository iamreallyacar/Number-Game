# Games

This folder holds the game registry for both kinds of game, the stored format upgrade runner, and each game's server module. `room-game.ts` turns a room game definition into a registered game that starts a run session: an object that holds the run and the pending input of every player, and speaks in JSON text, so the shared room code never sees the run type or the message types. Where this folder sits among the other parts is in `ARCHITECTURE.md`.

## Registry

Every game is listed in `create-game-registry.ts`. The server modules are `number-game.ts`, `block-game.ts`, and `survivor-game.ts`, and the browser modules are the `<game>-module.ts` files in `apps/web/src/games/<game>/`, listed in `apps/web/src/games/create-browser-game-registry.ts`.

`game-registry.ts` has one lookup for each kind and one for both:

| Lookup | Use |
| --- | --- |
| `getSavedGame` | The slot and move routes. Refuses a room game with 400 and `wrong-game-kind` |
| `getRoomGame` | The room routes and the WebSocket route. Refuses a saved game with 400 and `wrong-game-kind` |
| `getGame` | The high score routes, which only need what both kinds share: the id, the categories, and reading summary details |

Each lookup refuses an unknown id with 404 and `unknown-game`.

## Room game definition

A room game gives `defineRoomGame` this definition:

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
