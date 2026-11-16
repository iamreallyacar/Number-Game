# Block Game Rules Package

This package holds the Block Game rules as plain TypeScript, with no browser or server code. The server module and the browser module of the Block Game both use it. Its random shapes come from `@local/seeded-random`, whose generator state is stored in the game state. The requirements are in `REQUIREMENTS/block-game/`.

## Contract

`src/index.ts` exports only what the server and the browser use. Every function is pure: it takes a game state and returns a new one without changing the old one. The package owns every fact about the game that the server and the browser must agree on:

- `BLOCK_GAME_ID`, the id both apps register the game under.
- `BOARD_SIZE`, the number of rows and columns of the board, which is always 10.
- The deal weights. Each shape has a starting weight and a late weight, and the deal weights move from one to the other in even steps over the first 200 placements. `deal-weights.ts` uses whole number math only, so the browser and the server always agree.
- `BlockGameMove` and `applyMove`, the moves a player can make and the one function that applies any of them. The server module checks its move schema against `BlockGameMove` when it compiles.
- The fairness check behind every dealt hand, in `fair-hand.ts` and `deal-shapes.ts`. The server and the browser deal the same hands because both run the same package.
- `isGameOver`, which the server calls after every accepted move to end the game.
- `summarizeGame` and `parseSummaryDetails`, which write and read back the summary shown next to save slots and high scores. `BLOCK_GAME_CATEGORIES` lists the high score categories, which is the single category `BLOCK_GAME_CATEGORY`.
- `GAME_STATE_UPGRADES` and `SUMMARY_DETAILS_UPGRADES`, which upgrade stored states and summary details written by older versions of the game.

For the browser, `applyPlacement` returns what `applyMove` leaves out: the placed cells, the cleared rows, columns, and cells, and the points earned. `shapeFitsAt` and `linesClearedByPlacement` drive the drag preview, `shapeFitsAnywhere` marks the shapes that have no room left, and `ShapeSlots` holds `null` for a slot whose shape was already placed in this hand, and `getShape` describes a shape.

Moves that a player can get wrong, such as a shape that sticks out of the board, return a result with `accepted: false` and a reason, so the server can tell the browser why a move was refused. Mistakes in the calling code, such as asking which lines a shape clears where it does not fit, throw an error.

## Changing the Stored Format

Saved games keep a `GameState` as JSON, and high scores keep the summary details as JSON. When a change adds, renames, or removes a field in either one, add an upgrade to the end of the matching list in `stored-format-upgrades.ts`, typed with `StoredFormatUpgrade` from `@local/stored-values`, that turns the old shape into the new one. Never edit an upgrade that has shipped. Shape ids are stored in saved games too, so a shape that has shipped must never be renamed or removed from the catalogue. Without an upgrade, every existing save would be rejected as broken.

## Files

| File | Job |
| --- | --- |
| `game-id.ts` | The game id |
| `game-state.ts` | The `GameState` type, the board size, and the slot count. Cells are a flat list in reading order. A slot is empty (`null`) once its shape is placed, and a state always has at least one filled slot |
| `board-cell.ts` | The `ShapeColour` and `BoardCell` types |
| `shape-catalogue.ts` | Every shape with its id, cells, colour, starting weight, and late weight. The weights are tuned here |
| `board.ts` | Row and column math, and finding full rows and columns |
| `shape-fit.ts` | Whether a shape fits at a position or anywhere, and which lines a placement would clear |
| `fair-hand.ts` | `canPlaceWholeHand`, a depth first search for a way to place every shape of a hand in some order, clearing lines after each placement. It stops at the first success, skips repeated identical shapes, and gives up at the search limit of BG-22 |
| `place-and-clear.ts` | Fills a shape in and clears its full rows and columns. Used by the placement rule and by the fairness check |
| `deal-weights.ts` | The 200 placement ramp and `dealWeightOf`, the current deal weight of a shape |
| `deal-shapes.ts` | Weighted random shapes by the current deal weights, and `dealHand`, which deals the three shapes of the first hand (0 placements) and of every later hand on the board it is given. It redraws an unfair hand up to 30 times, then deals three single cells |
| `new-game.ts` | Starts a game from a seed chosen by the caller |
| `scoring.ts` | Points for placed blocks and cleared lines |
| `place-shape.ts` | Applies a placement, clears full lines, adds points, updates the streak, empties the used slot, and deals a new hand when all three slots are empty. Refuses a move on an empty slot |
| `game-over.ts` | Whether any shape left in the hand still fits, and game over. Empty slots are skipped |
| `move.ts` | The move type and `applyMove`, which sends each move to its rule |
| `summary.ts` | The summary of a state for save slots and high scores, and the check that reads its details back |
| `parse-game-state.ts` | Checks a stored game state, including that at least one slot is filled, and throws `InvalidGameStateError` if it is broken |
| `stored-format-upgrades.ts` | Upgrades for stored states and summary details |
| `test-support.ts` | Board builders for the tests. Left out of the build |
