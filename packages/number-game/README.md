# Number Game Rules Package

This package holds the Number Game rules as plain TypeScript, with no browser or server code. Its random numbers come from `@local/seeded-random`, whose generator state is stored in the game state. The server module in `apps/server/src/games/number-game.ts` and the browser module in `apps/web/src/games/number-game/` both use it. The requirements are in `REQUIREMENTS/number-game/`.

## Contract

`src/index.ts` exports only what the server and the browser use. Every function is pure: it takes a game state and returns a new one without changing the old one. The package owns every fact about the game that the server and the browser must agree on:

- `NUMBER_GAME_ID`, the id both apps register the game under.
- `NumberGameMove` and `applyMove`, the moves a player can make and the one function that applies any of them. The server module checks its move schema against `NumberGameMove` when it compiles.
- `isGameOver`, which the server calls after every accepted move to end the game.
- `summarizeGame` and `parseSummaryDetails`, which write and read back the summary shown next to save slots and high scores. `DIFFICULTY_IDS` lists the high score categories.
- `GAME_STATE_UPGRADES` and `SUMMARY_DETAILS_UPGRADES`, which upgrade stored states and summary details written by older versions of the game.

Moves that a player can get wrong, such as a match that is not a pair, return a result with `accepted: false` and a reason, so the server can tell the browser why a move was refused. Mistakes in the calling code, such as advancing a stage while numbers are left, throw an error.

## Changing the Stored Format

Saved games keep a `GameState` as JSON, and high scores keep the summary details as JSON. When a change adds, renames, or removes a field in either one, add an upgrade to the end of the matching list in `stored-format-upgrades.ts`, typed with `StoredFormatUpgrade` from `@local/stored-values`, that turns the old shape into the new one. Never edit an upgrade that has shipped. Without an upgrade, every existing save would be rejected as broken. The same goes for lowering a difficulty preset in `difficulty.ts`: the stored state check refuses a save that holds more Add Numbers uses or hints than its preset gives, so a lowered preset needs an upgrade that lowers the stored values too.

## Files

| File | Job |
| --- | --- |
| `game-id.ts` | The game id |
| `game-state.ts` | The `GameState` type and `BOARD_WIDTH`, the fixed board width of 10. Cells are a flat list in reading order, padded with empty cells to whole rows |
| `cell.ts` | The `Digit` and `Cell` types |
| `board.ts` | Row and column math, counting numbers, finding which numbers are on the board, clearing a pair, and removing empty rows |
| `difficulty.ts` | Easy, Normal, and Hard presets |
| `stage-board.ts` | Builds a new stage board from a planned solution, up to a fixed number of times, and keeps the first board inside the opening pair range of the difficulty, or else the closest |
| `solution-plan.ts` | Plans an order of matches that clears a starting board of placeholders, preferring matches that are blocked at the start as much as the difficulty asks, and counts the planned matches open at the start |
| `planned-pair-digits.ts` | Gives each planned match a pair group by simulated annealing, until no more unplanned pairs see each other at the start than the caller allows, and draws the numbers |
| `new-game.ts` | Starts a game from a difficulty and a seed chosen by the caller |
| `scoring.ts` | Points for matches, empty rows, and stage clears |
| `pair.ts` and `line-of-sight.ts` | Whether two numbers are a pair, pair groups, and which numbers a cell can see looking forward or backward |
| `match.ts` | Applies a match, removes empty rows, adds points, and moves to the next stage when the board is cleared |
| `add-numbers.ts` | Applies Add Numbers: counts the numbers to add and builds the set. On a small board it builds several sets and keeps the first one the search can clear completely, or else the one that leaves the fewest numbers. The values are the same on every preset |
| `added-numbers-candidate.ts` | Builds one set of numbers to add, aimed at numbers they will see, leaving every pair group even |
| `clear-search.ts` | Searches through orders of matches, up to a budget of boards, for the fewest numbers that can be left on a board |
| `stage-clear.ts` | Adds the stage bonus and fills a new board |
| `find-pair.ts` and `hint.ts` | Finds the first or every valid pair, for hints, the stuck warning, and game over |
| `move.ts` | The move type and `applyMove`, which sends each move to its rule |
| `summary.ts` | The summary of a state for save slots and high scores, and the check that reads its details back |
| `parse-game-state.ts` | Checks a stored game state and throws `InvalidGameStateError` if it is broken |
| `stored-format-upgrades.ts` | Upgrades for stored states and summary details. Version 2 of both removed the stored width |
| `test-support.ts` | Board builders for the tests. Left out of the build |
