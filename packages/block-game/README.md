# Block Game Rules Package

This package holds the Block Game rules as plain TypeScript, with no browser or server code. The server module and the browser module of the Block Game both use it. Its random shapes come from `@local/seeded-random`, whose generator state is stored in the game state. The requirements are in `REQUIREMENTS/block-game/`.

## Contract

Everything is exported through `src/index.ts`. Every function is pure: it takes a game state and returns a new one without changing the old one. The package owns every fact about the game that the server and the browser must agree on:

- `BLOCK_GAME_ID`, the id both apps register the game under.
- `BlockGameMove` and `applyMove`, the moves a player can make and the one function that applies any of them. The server module checks its move schema against `BlockGameMove` when it compiles.
- `isGameOver`, which the server calls after every accepted move to end the game.
- `summarizeGame` and `parseSummaryDetails`, which write and read back the summary shown next to save slots and high scores. `BOARD_SIZE_CATEGORIES` lists the high score categories.
- `GAME_STATE_UPGRADES` and `SUMMARY_DETAILS_UPGRADES`, which upgrade stored states and summary details written by older versions of the game.

For the browser, `applyPlacement` returns what `applyMove` leaves out: the placed cells, the cleared rows, columns, and cells, and the points earned. `shapeFitsAt` and `linesClearedByPlacement` drive the drag preview, `shapeFitsAnywhere` marks the shapes that have no room left, and `getShape` describes a shape.

Moves that a player can get wrong, such as a shape that sticks out of the board, return a result with `accepted: false` and a reason, so the server can tell the browser why a move was refused. Mistakes in the calling code, such as asking which lines a shape clears where it does not fit, throw an error.

## Changing the Stored Format

Saved games keep a `GameState` as JSON, and high scores keep the summary details as JSON. When a change adds, renames, or removes a field in either one, add an upgrade to the end of the matching list in `stored-format-upgrades.ts` that turns the old shape into the new one. Never edit an upgrade that has shipped. Shape ids are stored in saved games too, so a shape that has shipped must never be renamed or removed from the catalogue. Without an upgrade, every existing save would be rejected as broken.

## Files

| File | Job |
| --- | --- |
| `game-id.ts` | The game id |
| `game-state.ts` | The `GameState` type, board sizes, and the slot count. Cells are a flat list in reading order |
| `board-cell.ts` | The `ShapeColour` and `BoardCell` types |
| `shape-catalogue.ts` | Every shape with its id, cells, colour, and weight. The weights are tuned here |
| `board.ts` | Row and column math, and finding full rows and columns |
| `shape-fit.ts` | Whether a shape fits at a position or anywhere, and which lines a placement would clear |
| `deal-shapes.ts` | Weighted random shapes for the starting slots and each refill |
| `new-game.ts` | Starts a game from a board size and a seed chosen by the caller |
| `scoring.ts` | Points for placed blocks and cleared lines |
| `place-shape.ts` | Applies a placement, clears full lines, adds points, updates the streak, and refills the slot |
| `game-over.ts` | Whether any slot shape still fits, and game over |
| `move.ts` | The move type and `applyMove`, which sends each move to its rule |
| `summary.ts` | The summary of a state for save slots and high scores, and the check that reads its details back |
| `parse-game-state.ts` | Checks a stored game state and throws `InvalidGameStateError` if it is broken |
| `stored-format-upgrades.ts` | Upgrades for stored states and summary details |
| `test-support.ts` | Board builders for the tests. Left out of the build |
