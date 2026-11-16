# Survivor Game Rules Package

This package holds the Survivor Game rules as plain TypeScript, with no browser or server code. The server module and the browser module of the Survivor Game both use it. Its random numbers come from `@local/seeded-random`, whose generator state is part of the run state. The requirements are in `REQUIREMENTS/survivor-game/`.

## Contract

`src/index.ts` exports only what the server and the browser use. The package owns every fact about the game that the two apps must agree on:

- `SURVIVOR_GAME_ID`, the id both apps register the game under.
- `balance`, every value of `balance.md` as one named value each (SB-10). No other file holds a copy of such a number.
- `RunState`, the whole run as plain data that survives JSON. It holds no clock and no connection information.
- `createRun({ playerIds, seed })` and `stepRun(state, inputs)`. `stepRun` is pure: it advances time by one step of 1 / `balance.STEP_RATE` seconds and returns a new state. All randomness comes from the seeded generator in the state.
- `StepInputs`, a map from player ID to `PlayerInput` (a direction or null, and an upgrade choice or null). A player missing from the map has no input and stands still, which is how a dropped player is stepped (SG-44).
- Refused input. `stepRun` throws `UpgradeChoiceRefusedError` (with the player ID, the upgrade, and a reason of `unknown-player`, `no-open-offer`, or `not-in-offer`) for a choice that is not in that player's open offer, and `InvalidStepInputError` for an unknown player or a direction that is not a number. In both cases nothing has changed. The server asks `findUpgradeChoiceRefusal` when a message arrives and answers the player with the reason, so the step never throws in normal play. If a team upgrade chosen earlier in the same step takes a choice out of another player's offer, that choice is skipped and the player sees the changed offer.
- `endRunAsAbandoned`, which the server calls when no player was connected for `balance.EMPTY_RUN_SECONDS` (SG-47). The rules do not know about connections. `isRunOver` tells whether a run has ended, and `stepRun` throws `RunAlreadyEndedError` for one that has.
- The WebSocket message types `ClientMessage` and `ServerMessage`, the checks `parseClientMessage` and `parseServerMessage` that throw `InvalidMessageError`, and the shared constants `SOCKET_PLAYER_ID_PARAMETER` and `STEPS_PER_STATE_REPORT`. The server sends a `RunStateReport` made by `buildRunStateReport`, not the run state, and `parseRunStateReport` checks it. `parseClientMessage` refuses a direction part beyond `MAX_DIRECTION_COMPONENT`.
- `summarizeRun`, `parseSummaryDetails`, and `SURVIVOR_GAME_CATEGORIES`, which write and read back the result of a run: the score, the number of players as the category, and the time survived and the level reached as the details (SG-49). `SUMMARY_DETAILS_UPGRADES` upgrades details written by older versions.
- Upgrade ids, limits, and titles, and the room limits `MIN_PLAYERS_PER_ROOM` and `MAX_PLAYERS_PER_ROOM`.

A run is never stored, so it has no stored format and no upgrades. Summary details are stored with high scores. When a change adds, renames, or removes a field in them, add an upgrade to the end of the list in `stored-format-upgrades.ts` and never edit one that has shipped.

## Rules Of A Step

Each step does these things in order:

1. Upgrade choices are applied, and a choice opens the player's next waiting offer.
2. Players with a direction move, then the rope pulls back every pair that is too far apart.
3. Shot timers count down and due shots fire at the nearest enemy in range.
4. Bullets fly and damage the enemies they touch, and beaten enemies are removed. The team gains their points and experience.
5. New enemies appear, every enemy walks toward its nearest player, touching enemies damage the team, and enemies too far away are removed.
6. Levels are gained, each giving every player an offer. The run ends in defeat when the team health is 0.

Times in seconds are counted in whole steps, so a shot interval of 0.43 seconds is 13 steps.

## Files

| File | Job |
| --- | --- |
| `index.ts` | The exports the server and the browser use |
| `game-id.ts` | The game id |
| `balance.ts` | Every value of `balance.md`, one named value each |
| `room-limits.ts` | The smallest and largest number of players in a room (SG-04) |
| `run-state.ts` | The `RunState`, `PlayerState`, `Bullet`, and `Enemy` types |
| `player-input.ts` | The input types, the unit direction, and the error for an invalid input |
| `geometry.ts` | Vectors, distances, the nearest candidate, and a checked list lookup |
| `timing.ts` | Seconds to steps, the seconds of one step, and completed intervals |
| `upgrades.ts` | Upgrade ids, limits, and titles, and the upgrade counts |
| `player-stats.ts` | The basic shot values and the speed after upgrades |
| `new-run.ts` | `createRun`, which starts a run from a list of player IDs and a seed |
| `step-run.ts` | `stepRun`, which puts the parts of a step in order |
| `movement.ts` | Moving players (SG-10, SG-11) |
| `rope.ts` | Pulling pairs back to the rope length (SG-14 to SG-18) |
| `basic-shot.ts` | Shot timers and firing the fan of bullets (SG-20, SG-23, SG-24) |
| `bullets.ts` | Flying bullets and damaging enemies (SG-21, SG-22) |
| `enemy-spawning.ts` | When, where, and how strong new enemies appear, and the limit alive (SG-27 to SG-30) |
| `enemy-behaviour.ts` | Walking, touching, and removing enemies (SG-25, SG-26, SG-31, SG-33) |
| `experience.ts` | The experience bar and levels (SG-34, SG-35) |
| `offers.ts` | Offers, the offer queue, upgrade limits in offers, and swapping exhausted upgrades (SG-36, SG-37, SG-41 to SG-43) |
| `upgrade-choice.ts` | Checking and applying an upgrade choice (SG-38 to SG-40) |
| `end-of-run.ts` | Defeat, the abandoned run, and whether a run is over (SG-47, SG-48) |
| `summary.ts` | The result of a run for high scores and the check that reads its details back |
| `stored-format-upgrades.ts` | Upgrades for stored summary details |
| `messages.ts` | The WebSocket message types and shared connection constants |
| `read-message-fields.ts` | Small checks and the error class that the message checks share |
| `parse-client-message.ts` | Checks a message from a browser |
| `parse-server-message.ts` | Checks a message from the server |
| `state-report.ts` | The `RunStateReport` type and `buildRunStateReport`, which makes the part of a run state the browsers draw, with positions rounded to 1 decimal |
| `parse-state-report.ts` | Checks a state report that arrived over the WebSocket |
| `test-support.ts` | Run, player, and enemy builders for the tests. Left out of the build |
