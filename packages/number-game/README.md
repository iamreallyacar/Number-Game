# Number Game Rules Package

This package holds the Number Game rules as plain TypeScript, with no browser or server code. Its random numbers come from `@local/seeded-random`, whose generator state is stored in the game state. The server module in `apps/server/src/games/number-game.ts` and the browser module in `apps/web/src/games/number-game/` both use it. The requirements are in `REQUIREMENTS/number-game/`.

## Contract

Everything is exported through `src/index.ts`. Every function is pure: it takes a game state and returns a new one without changing the old one. The package owns every fact about the game that the server and the browser must agree on:

- `NUMBER_GAME_ID`, the id both apps register the game under.
- `NumberGameMove` and `applyMove`, the moves a player can make and the one function that applies any of them. The server module checks its move schema against `NumberGameMove` when it compiles.
- `isGameOver`, which the server calls after every accepted move to end the game.
- `summarizeGame` and `parseSummaryDetails`, which write and read back the summary shown next to save slots and high scores. `DIFFICULTY_IDS` lists the high score categories.
- `GAME_STATE_UPGRADES` and `SUMMARY_DETAILS_UPGRADES`, which upgrade stored states and summary details written by older versions of the game.

Moves that a player can get wrong, such as a match that is not a pair, return a result with `accepted: false` and a reason, so the server can tell the browser why a move was refused. Mistakes in the calling code, such as advancing a stage while numbers are left, throw an error.

## Changing the Stored Format

Saved games keep a `GameState` as JSON, and high scores keep the summary details as JSON. When a change adds, renames, or removes a field in either one, add an upgrade to the end of the matching list in `stored-format-upgrades.ts` that turns the old shape into the new one. Never edit an upgrade that has shipped. Without an upgrade, every existing save would be rejected as broken. The same goes for lowering a difficulty preset in `difficulty.ts`: the stored state check refuses a save that holds more Add Numbers uses or hints than its preset gives, so a lowered preset needs an upgrade that lowers the stored values too.

## Files

| File | Job |
| --- | --- |
| `game-id.ts` | The game id |
| `game-state.ts` | The `GameState` type. Cells are a flat list in reading order, padded with empty cells to whole rows |
| `cell.ts` | The `Digit` and `Cell` types |
| `board.ts` | Row and column math, counting numbers, finding which numbers are on the board, and removing empty rows |
| `difficulty.ts` | Easy, Normal, and Hard presets |
| `stage-board.ts` | Fills a new stage board. On Easy, many cells are made to pair with the cell before them |
| `new-game.ts` | Starts a game from a width, a difficulty, and a seed chosen by the caller |
| `scoring.ts` | Points for matches, empty rows, and stage clears |
| `pair.ts` and `line-of-sight.ts` | Whether two numbers are a pair and whether they can see each other |
| `match.ts` | Applies a match, removes empty rows, adds points, and moves to the next stage when the board is cleared |
| `add-numbers.ts` | Applies Add Numbers, drawing only numbers still on the board |
| `stage-clear.ts` | Adds the stage bonus and fills a new board |
| `find-pair.ts` and `hint.ts` | Finds a valid pair for hints, the stuck warning, and game over |
| `move.ts` | The move type and `applyMove`, which sends each move to its rule |
| `summary.ts` | The summary of a state for save slots and high scores, and the check that reads its details back |
| `parse-game-state.ts` | Checks a stored game state and throws `InvalidGameStateError` if it is broken |
| `stored-format-upgrades.ts` | Upgrades for stored states and summary details |
| `test-support.ts` | Board builders for the tests. Left out of the build |
