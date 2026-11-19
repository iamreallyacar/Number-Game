# Audit

This file records four audits, all from 2026-11-19. Each finding was checked again against the files by the main agent, and findings that did not hold up are listed under Ruled out.

- A requirement audit, which checked whether the requirements in `REQUIREMENTS/` contradict each other.
- A test audit, which checked whether the tests check correct behaviour.
- A bug hunt, split into four parts: the puzzle packages, the Survivor Game package, the server, and the web app.
- A maintainability audit, split into three parts: the packages, the server, and the web app.

## Open

These maintainability findings are not yet dealt with.

| Id | Where | Problem | Risk | Size of fix |
| --- | --- | --- | --- | --- |
| M-1 | `NumberGamePlayScreen.svelte:30-125`, `BlockGamePlayScreen.svelte:42-160`, `SurvivorGamePlayScreen.svelte:30-75` | Each play screen has its own copy of "show a message for a while", "show an effect and remove it later", the timers behind them, and their cleanup. `FEEDBACK_SHOW_MS = 2500` is defined twice. | A timer fix in one screen does not reach the others, and a new saved game would copy it a third time. | Medium: one small shared `.svelte.ts` helper |
| M-2 | `API.md` | The error codes `unknown-slot`, `unknown-category`, `invalid-move`, `move-refused`, `invalid-options`, and `player-exists` are sent by the server and read by the web app, but `API.md` does not list them. Only the room routes have an Errors column. | A code can be renamed without anyone noticing that the web app depends on it. | Small: one error code table in `API.md` |
| M-3 | `apps/server/src/routes/save-slot-routes.ts:28`, `room-routes.ts:26` | `RANDOM_SEED_LIMIT = 2 ** 32` is defined in both files. `API.md` says room seeds are picked like save seeds. | Changing one leaves the other on the old range. | Small: one shared constant |
| M-4 | `block-game/src/summary.ts:44`, `block-game/src/parse-game-state.ts:82`, `number-game/src/parse-game-state.ts:89`, `survivor-game/src/summary.ts:54`, `survivor-game/src/read-message-fields.ts:20` | The "refuse unknown fields" loop is written five times. | A change to how strict stored values are has to be made in five places. | Small: one helper in `stored-values` |
| M-5 | `BlockGamePlayScreen.svelte:42` and `:46`, `NumberGamePlayScreen.svelte:34` | `BOARD_GRID_LINE_PX` and the 2000 ms effect times must match CSS in other files, which only a comment says. | Editing the CSS gap or animation length silently breaks drop targets or effect timing. | Small: take the value from one place, such as a CSS variable |

## Resolved

| Ids | What was found | What was done |
| --- | --- | --- |
| B-1 | Player IDs that differed only in the case of a non-ASCII letter could both exist, which broke OQ-18. | Fixed with migration 8 and a `player_key` column, covered by tests in `player-routes.test.ts`. |
| R-1 to R-6 | Requirement docs that disagreed with each other or with the code: SG-09, BG-22, SG-43, the README purpose, and the `SAVE_SLOTS_PER_GAME` range. None had led to wrong code. | The docs were reworded to match. R-2, about the rope in SG-14, needed no change, because the overshoot measured below 0.0001. |
| T-1 to T-16 | Tests that would still pass if the behaviour they are named after broke, or that read expected values from the code's own constants. No test checked for wrong behaviour. | Each test was strengthened, and each one was shown to fail when the code was broken on purpose. |
| B-2 to B-6 | Bugs from the bug hunt: a repeated Survivor Game offer that could not be chosen, a move saved twice after a lost answer, a sound left silent after a failed load, a room poll overwriting Join and Start, and a bullet hit spent on a beaten enemy. | Each was fixed after a test that failed first. B-3 added migration 9 and a move number on every move, described in `API.md`. |
| Q-1 | Delete ignored the save lock, and the requirements did not say whether it should. | Kept as it is. PS-18 and `API.md` now say the lock covers only saving moves. |

## Ruled out

These were reported or suspected but did not hold up when checked again.

- `PS-22` showing save slots on every game page. Line 3 of `players-saves-scores.md` limits save slot requirements to saved games, and PS-24 covers room games.
- `BACKLOG.md` T-97, about high score categories being repeated. It is real, but it is already recorded in the backlog.
- OQ-26 citing PS-23 for the category rule. The citation covers the whole answer, and PS-23 covers the team and personal best part.
- The NG-30 example "+60 when a row is removed" not covering two removed rows. It is an example ("such as"), and NG-23 gives the rule.
- The save lock (PS-18, OQ-14) against loading from any device (OQ-06). The lock follows the device that opened the save most recently, so both rules hold.
- SG-06 ("nobody new can join") against SG-45 (rejoin). A rejoin is not a join, and `API.md` says the same.
- Removed features: board widths 11 and 12, Block Game sizes 8 and 9, and the Disk Game. They only appear in answered questions.
- Weak but acceptable tests: the 100-step health check in `step-run.test.ts:186-189`, the loose ratios in `deal-shapes.test.ts:41-47`, the `if (outcome.accepted)` guards in the server game tests (each follows a `toMatchObject({ accepted: true })`), and the player list order in `player-routes.test.ts:12`, which matches `ORDER BY player_id`.
- The WebSocket matching the player ID in its exact letter case. The web app always sends the ID as stored, so it cannot happen through the app.
- `PLAYER_KEY_MIGRATION_VERSION = 8` being counted by hand. Migrations are only ever added at the end, and the clash test fails if the number points at the wrong migration.
- Small maintainability reports that would not make changes safer: `emptySlot` naming three slots (the `ShapeSlots` type would catch a change), the Survivor Game category being a plain string, the player ID length of 24 (it is only in the schema), the shared game over sound rule (one line), the play screen CSS (the copies differ), `MAX_SOCKET_MESSAGE_BYTES` living in `app.ts`, inline config ranges (each is used once), route test setup helpers (each sets up something different), the `{feedback ?? ''}` that keeps the line height, and migrations naming removed game ids.
- The puzzle packages: no bugs found. 120 Number Game and 200 Block Game games were played with random moves, and every state was saved and read back without a problem.
