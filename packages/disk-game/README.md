# Disk Game Rules Package

This package holds the Disk Game rules as plain TypeScript, with no browser or server code. The server module and the browser module of the Disk Game both use it. Its random layouts come from `@local/seeded-random`, whose generator state is stored in the game state. The requirements are in `REQUIREMENTS/disk-game/`.

## Contract

Everything is exported through `src/index.ts`. Every function is pure: it takes a game state and returns a new one without changing the old one. The package owns every fact about the game that the server and the browser must agree on:

- `DISK_GAME_ID`, the id both apps register the game under.
- `DiskGameMove` and `applyMove`, the moves a player can make and the one function that applies any of them. The server module checks its move schema against `DiskGameMove` when it compiles.
- `isGameOver`, which the server calls after every accepted move to end the game.
- `summarizeGame` and `parseSummaryDetails`, which write and read back the summary shown next to save slots and high scores. `STARTING_DISK_COUNT_CATEGORIES` lists the high score categories.
- `GAME_STATE_UPGRADES` and `SUMMARY_DETAILS_UPGRADES`, which upgrade stored states and summary details written by older versions of the game.

For the browser, the single rules return what `applyMove` leaves out: `applyDiskMove` returns the stage clear with the sorted pegs and the points earned, `applyUndo` returns the move it took back, and `applyHint` returns the move to show. `findUndoProblem` and `findHintProblem` tell the play screen when to turn the two buttons off.

Moves that a player can get wrong, such as a drop onto a smaller disk, return a result with `accepted: false` and a reason, so the server can tell the browser why a move was refused. Mistakes in the calling code, such as asking `moveTopDisk` for a move that is not allowed, throw an error.

## Fewest Moves

The fewest moves of a layout is worked out directly, without a search. To gather every disk on one peg, the largest disk either is already there or must move there once. Before it can move, every smaller disk must be out of the way on the third peg, which becomes the goal of the smaller disks. Moving disk k and then stacking the smaller disks back on top of it takes 2 to the power of (k − 1) moves. Going from the largest disk down and adding this up gives the fewest moves for one peg, and the smallest out-of-place disk is the first move of that path. The answer for a layout is the smallest of the three pegs. The tests check this against a full search of every layout of up to 6 disks.

## Stored State

A stage clear replaces the sorted layout with the next stage's layout in the same move, so a stored state never holds a sorted layout. The state keeps the moves of the current stage that have not been undone, which is what undo takes back. `parseGameState` takes these moves back one by one and checks that the layout they started from has the stored fewest moves, so a save whose parts do not fit together is refused.

The summary details leave out the moves left once the game is over, because high scores do not show them (DK-21).

## Changing the Stored Format

Saved games keep a `GameState` as JSON, and high scores keep the summary details as JSON. When a change adds, renames, or removes a field in either one, add an upgrade to the end of the matching list in `stored-format-upgrades.ts` that turns the old shape into the new one. Never edit an upgrade that has shipped. Without an upgrade, every existing save would be rejected as broken. The same goes for raising the reroll rule in `layout.ts` (DK-07): the stored state check refuses a save whose stage needs fewer moves than the rule allows, so a raised rule needs the check loosened or an upgrade.

## Files

| File | Job |
| --- | --- |
| `game-id.ts` | The game id |
| `game-state.ts` | The `GameState` type, pegs and disks, the starting disk counts, and the disk count of each stage |
| `pegs.ts` | Top disks, the sorted peg, whether a move is allowed, and the pegs after a move |
| `fewest-moves.ts` | The fewest moves to a sorted layout and the first move of that path |
| `layout.ts` | Random layouts and the reroll rule. The reroll rule is tuned here |
| `stage.ts` | Starts a stage: deals its layout and tops up the move budget. The budget factor is tuned here |
| `new-game.ts` | Starts a game from a starting disk count and a seed chosen by the caller |
| `scoring.ts` | Points for clearing a stage and for a perfect stage |
| `move-disk.ts` | Applies a disk move, and clears the stage when the disks are sorted |
| `undo.ts` | Takes back the last move of the stage, and when undo is turned off |
| `hint.ts` | Pays for a hint and gives the move to show, and when the hint is turned off. The hint cost is tuned here |
| `game-over.ts` | Whether the moves left can still clear the stage |
| `move.ts` | The move type and `applyMove`, which sends each move to its rule |
| `summary.ts` | The summary of a state for save slots and high scores, and the check that reads its details back |
| `parse-game-state.ts` | Checks a stored game state and throws `InvalidGameStateError` if it is broken |
| `stored-format-upgrades.ts` | Upgrades for stored states and summary details |
| `test-support.ts` | A state builder for the tests. Left out of the build |
