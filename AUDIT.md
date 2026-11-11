# Audit

This file records the quality audits of the project. The final audit was made on 2026-11-11, when the project was closed. It covered every source file, config file, and document, split into four reviews: the packages, the server, the browser app, and the documents. `npm run check` passed before the audit (65 test files, 461 tests) and after its fixes (65 test files, 466 tests).

## Verdict

The project is in good shape to close. The reviews found no high risk bug in the game rules, the server, or the browser app. Typing is strict everywhere, with no `any` types, and the few casts and lint exceptions each have a comment. No to-do notes are left in the code. Errors fail loudly, every query uses bound parameters, and every server answer is checked against the shared schemas.

What is left is small: a few edge cases around broken saves, code that is copied between the three games, and export lists that are wider than the apps need. None of it gets in the way of personal use. The open findings below are the places to start if work on the project picks up again.

## Fixed in the Final Audit

| Id | Area | Finding | Fix |
| --- | --- | --- | --- |
| F-01 | Browser | Leaving the play page through a link inside the app dropped the moves still queued for saving, with no warning | `MoveSync.finishPendingMoves` still sends the queued moves after the play page closes. `stop` is kept for reloading a save |
| F-02 | Browser | The Number Game message line appeared and vanished above the board, so the board moved under the player's next tap | The line always takes up its space, as in the other two games. The stuck warning shows on the same line |
| F-03 | Server | Requests that Fastify refuses itself, such as a broken JSON body or a body that is too large, were answered as a 500 server error and logged as one | The error handler answers them with their own 4xx status and the error `invalid-request` |
| F-04 | Server | Opening a save that cannot be read moved its device lock before failing | The answer is built before the lock moves |
| F-05 | Server | Personal bests were sorted by category as text, so the Block Game showed 10, 8, 9 | They follow the order of the game's category list |
| F-06 | Server | The migration runner repeated the code of `run-in-transaction.ts` | It calls `runInTransaction` |
| F-07 | Browser | Dead props: `disabled` on the Number Game action bar and `dashboardPath` on the save status banner. A comment in `device-id.ts` described the server's rule, not the code | Removed the props and reworded the comment |
| F-08 | Packages | An export used by one file only, a build exclude for a file that does not exist, and comments that named the open tuning task | Cleaned up |
| F-09 | Documents | The Block Game package README named functions the browser does not use, the Number Game one left out `isGameOver`, and `ARCHITECTURE.md` left out the not found page | Corrected |
| F-10 | Documents | The shared save and high score requirements (PS-05, PS-09, PS-13 to PS-15) only described the Number Game | Reworded to cover every game's own options, details, and category |
| F-11 | Documents | The status sections in `README.md` and `ARCHITECTURE.md` repeated `TASKS.md` and were out of date. OQ-17 was out of date, and OQ-18 and OQ-19 were answered by the code but still listed as open | `TASKS.md` has a close-out note and is the only place for status. The open questions are updated |

## Open Findings

These were left as they are, because each one needs a decision or a larger change than a close-out should make.

| Id | Priority | Area | Finding | Suggested fix |
| --- | --- | --- | --- | --- |
| O-01 | Medium | Server | One save that cannot be read makes the whole slot list fail for that game, so New Game and Load Game stop working and the save cannot be deleted from the app. A high score row that cannot be read does the same to the high score table. See `save-slot-routes.ts` and `high-score-routes.ts` | List such a save as broken, with no summary, so it can still be deleted. This needs a change to the slot list schema |
| O-02 | Medium | Packages | Tuning some values breaks saves in progress, though the stored format does not change. The Number Game state check refuses more Add Numbers uses or hints than the preset gives, and the Disk Game check refuses a stage below the reroll rule. Both package READMEs now warn about this | Loosen the two checks, or add a stored state upgrade with the tuning change |
| O-03 | Medium | Browser | The Block Game can only be played with a pointer. Its slots are not buttons, so there is no keyboard or screen reader path | Add a tap a slot, then tap a cell mode |
| O-04 | Low | Browser | Code copied between the three games: the game over panels, the wrong move sound and the bell helper, `BoardPosition`, the effect and status bar styles, and the feedback timer | Move them into `components/`, `audio/`, and `app.css` |
| O-05 | Low | Packages | The stored value helpers (`fail`, `readRecord`, and the whole number checks) are written in all three `parse-game-state.ts` and `summary.ts` files, with different names | Share them from one small package, as `seeded-random` is shared |
| O-06 | Low | Packages | Each package index exports many names that no app imports, such as the scoring constants and single rule helpers. The server also keeps its own copy of the `StoredFormatUpgrade` type | Trim each index to what the apps use, or keep the lists on purpose as the public contract |
| O-07 | Low | Packages | `rowOf` and `columnOf` take their arguments in opposite orders in the Number Game and the Block Game. File names for the same job differ too, such as `find-pair.ts` and `game-over.ts` for `isGameOver` | Pick one order and one set of names |
| O-08 | Low | Server | Naming: `findPlayerId` in `request-lookups.ts` throws while the store method of the same name returns null, and the store's `GameResult` shares its name with the API type. The Number Game move schema sets a minimum of 0 and the other two games set none. `layout.ts` in the Disk Game skips an impossible peg index quietly | Rename, and make the three schemas alike |
| O-09 | Low | Tests | No tests for `router.ts`, the Svelte components, the Disk Game undo and hint screen state, or the Block Game pointer handling. The three server game test files do not cover the same cases, and two of them copy the server setup | Move screen logic into plain helpers such as `tap-peg.ts`, and let `startTestServer` take a game registry |
| O-10 | Low | Browser | The sound button label can be read as the current state or as the action. The Number Game has no game over sound, and the other two games do | Add `aria-pressed` and a fixed label. Decide on the sound |
| O-11 | Low | Documents | Facts kept in two places: the game summaries in `README.md` and the rules files, the fixed container values in `README.md` and `ARCHITECTURE.md`, the high score categories in `ARCHITECTURE.md` and the rules files, and the tech stack in `open-questions.md` and `ARCHITECTURE.md`. `README.md` also holds setup guides, which is more than the purpose and scope that `CLAUDE.md` asks of it | Keep each fact in one place and point to it from the other |
| O-12 | Low | Documents | `CLAUDE.md` still says the dashboard is starting with the Number Game, and its directory list leaves out `AUDIT.md`, `apps/`, and `packages/` | Update the two sections |
| O-13 | Low | Tooling | `npm audit` reports 12 low and moderate warnings, all in lint and build tools. `npm audit --omit=dev` reports none, so nothing in the Docker image is affected. See OQ-17 | Update the tools when fixed versions are released |

The three playtest and tuning tasks (T-41, T-55, T-61) were not carried out. See the close-out note in `TASKS.md`.

## What Is Good

- The game registries on both sides keep every game behind one interface, and routes are generic over the game id, so a new game needs no new routes and one line in each registry.
- The server applies every move itself with the same rules package as the browser, so the browser cannot save a fake state.
- Each rules package owns its id, move type, `applyMove`, and summary. The server checks its move schema against the move type when it compiles.
- The stored state checks compare the parts of a save against each other, and stored formats carry a version with upgrade lists.
- The save id check comes before the lock check, so a stale page can never open, change, or take the lock of a newer game.
- Rules are kept out of the Svelte files in small tested helpers, every timer is cleared when a screen closes, and reduced motion is respected.
- Settings are read from the environment and documented in `README.md` and `.env.example`.

## Earlier Audit

The first audit was made on 2026-11-10, before the Block Game and the Disk Game, and asked whether the project would stay maintainable as games were added. Every finding was fixed, most on the same day (T-42 and T-43 in `TASKS.md`).

| Id | Finding | Outcome |
| --- | --- | --- |
| A-01 | Saved game states could not be upgraded | Saves and high scores store a format version, and each game gives upgrade lists in its `stored-format-upgrades.ts` |
| A-02 | The server API shapes were written twice | `packages/game-server-api` holds the schemas for both the server and the browser |
| A-03 | Each game's id, moves, and summary were written in several places | The rules package owns them |
| A-04 | Shared server tests depended on the Number Game | They use `apps/server/src/counter-test-game.ts` |
| A-05 | Documents would grow with every game | Each rules package has a `README.md`, and each game has its own folder in `REQUIREMENTS/` |
| A-06 | Every game was in the first browser download | Play screens and option forms load with a dynamic `import()` when first needed |
| A-07 | Repeated checks in the server routes | Shared in `apps/server/src/routes/request-lookups.ts` |
| A-08 | Move answers carried data that nothing read | The move answer no longer carries `details` or `state` |
| A-09 | The high scores page did two jobs | Split into `TopResultsTable.svelte` and `PersonalBestsList.svelte` |
| A-10 | Phase 4 was not committed | Committed |
