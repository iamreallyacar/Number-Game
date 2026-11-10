# Number Game Rules

These requirements define how the Number Game plays. Cells are counted by row (top to bottom) and column (left to right), starting at 1.

## Terms

| Term | Meaning |
| --- | --- |
| Width (n) | Number of columns, chosen by the player at the start of a game |
| Cell | One square of the board. A cell is either empty or holds a number from 1 to 9 |
| Reading order | Left to right along a row, then continuing at column 1 of the next row, like reading text |
| Pair | Two numbers that are equal, or that add up to 10 |
| Stage | One full board. Clearing every number moves the player to the next stage |

## Board

- NG-01: When starting a new game, the player chooses the width n from 10, 11, or 12.
- NG-02: Each stage starts with n rows of n cells, each filled with a random number from 1 to 9.
- NG-03: The board has no height limit. Rows are added below as needed, and the board scrolls vertically when it is taller than the screen.

## Selecting and Matching

- NG-04: The player selects a number by tapping or clicking it. Tapping it again deselects it.
- NG-05: When a second number is selected, the game checks whether the two numbers are a pair and have line of sight.
- NG-06: If both checks pass, both cells become empty and the player earns points.
- NG-07: If either check fails, nothing is cleared and the game shows clear feedback, such as a short shake or flash, and the selection is reset.
- NG-08: A 5 and a 5 is a valid pair. It counts once and earns the normal match points.

## Line of Sight

Two numbers have line of sight if any one of the following is true:

- NG-09: Horizontal: they are in the same row and every cell between them is empty.
- NG-10: Vertical: they are in the same column and every cell between them is empty.
- NG-11: Diagonal: they lie on the same diagonal (the row difference equals the column difference) and every cell between them on that diagonal is empty.
- NG-12: Reading order: every cell between them in reading order is empty. This lets a number see past the end of its row into the next row.

Reading order example on a board with width 10: row 1 column 7 holds a 3, and row 2 column 2 holds a 7. Row 1 columns 8 to 10 and row 2 column 1 are empty. Following reading order from the 3, the next number found is the 7, so they have line of sight. Since 3 + 7 = 10, they clear.

- NG-13: Only horizontal reading order wraps between rows. Vertical and diagonal lines stop at the edge of the board.

## Removing Empty Rows

- NG-14: When every cell in a row is empty, that row is removed and all rows below it move up by one.
- NG-15: Empty cells in a row that is not fully empty stay where they are. Numbers never slide sideways to fill gaps.

## Adding Numbers

- NG-16: An Add Numbers button sits below the board.
- NG-17: Pressing it adds new random numbers from 1 to 9. The count is 50 percent of the numbers currently on the board, rounded up, with at least 1.
- NG-18: New numbers are placed in reading order starting right after the last number on the board, filling the rest of that row and then new rows below.
- NG-19: The number of uses per stage is set by the difficulty (see `difficulty.md`). The button shows how many uses remain and is disabled when none remain.

## Stages

- NG-20: When the board has no numbers left, the player earns a stage clear bonus and moves up to the next stage.
- NG-21: A new stage fills the board again as described in NG-02 and resets Add Numbers and hints to the full count for the difficulty.
- NG-22: The current stage number is always visible during play.

## Scoring

- NG-23: Points are awarded as shown below. These are starting values and may be tuned after playtesting.

| Event | Points |
| --- | --- |
| Matching a pair | 10 |
| Removing an empty row | 50 |
| Clearing the board | 500 multiplied by the stage number just cleared |

- NG-24: The current score is always visible during play.

## Stuck Warning

- NG-25: When no pair with line of sight exists and Add Numbers still has uses left, the game shows a message suggesting the player use Add Numbers.

## Game Over

- NG-26: The game never ends by clearing the board. It ends only when no pair with line of sight exists and Add Numbers has no uses left for the current stage.
- NG-27: On game over, the game shows the final score and stage, records the result in the high scores, and offers to start a new game or return to the dashboard.
- NG-28: The player can leave a game at any time and continue it later from its save slot (see `players-saves-scores.md`).
