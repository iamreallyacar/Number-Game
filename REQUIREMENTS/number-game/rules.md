# Number Game Rules

These requirements define how the Number Game plays. Cells are counted by row (top to bottom) and column (left to right), starting at 1.

## Terms

| Term | Meaning |
| --- | --- |
| Width (n) | Number of columns, chosen by the player at the start of a game |
| Cell | One square of the board. A cell is either empty or holds a number from 1 to 9 |
| Reading order | Left to right along a row, then continuing at column 1 of the next row, like reading text |
| Pair | Two numbers that are equal, or that add up to 10 |
| Pair group | Numbers that all pair with each other: 1 and 9, 2 and 8, 3 and 7, 4 and 6, and 5 alone |
| Stage | One full board. Clearing every number moves the player to the next stage |

## Board

- NG-01: When starting a new game, the player chooses the width n from 10, 11, or 12.
- NG-02: Each stage starts with n rows of n cells, each filled with a random number from 1 to 9, balanced as described in NG-34. When n times n is odd (width 11), the last cell starts empty, because an odd count of numbers can never all be paired off.
- NG-03: The board has no height limit. Rows are added below as needed, and the board scrolls vertically when it is taller than the screen.
- NG-29: Thin grid lines separate every row and column, including empty cells, so the player can follow a row, column, or diagonal across long distances.

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
- NG-17: Pressing it adds new random numbers from 1 to 9, limited as described in NG-33. The count is 50 percent of the numbers currently on the board, rounded up, with at least 1. When that count cannot leave every pair group even (NG-34), it grows to the smallest count that can, which is usually 1 more.
- NG-18: New numbers are placed in reading order starting right after the last number on the board, filling the rest of that row and then new rows below.
- NG-19: The number of uses per stage is set by the difficulty (see `difficulty.md`). The button shows how many uses remain and is disabled when none remain.
- NG-33: Add Numbers only adds numbers that are still on the board. A number that has been cleared off the board completely is not added again for the rest of the stage. A new stage fills the board from all numbers 1 to 9 as described in NG-02, so every number can appear again.
- NG-34: A pair group is a set of numbers that all pair with each other: 1 and 9, 2 and 8, 3 and 7, 4 and 6, and 5 alone. Every number can only be cleared when each pair group has an even count of numbers on the board. A new stage board always starts with every group even. Add Numbers first adds one number for each group that is odd, then adds the rest in pairs from the same group, mixed into a random order. Line of sight can still block pairs, so this does not promise that the board can be cleared.

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

## Effects and Sound

Effects only show what happened. They never change the rules, the score, or what is saved.

- NG-30: When a pair is cleared, both cleared cells show a short burst, and the points earned by the move float up from the second selected cell, such as +10, or +60 when a row is removed too.
- NG-31: The game plays a short sound for each of these events: selecting a number, clearing a pair, removing an empty row, a wrong match, pressing Add Numbers, showing a hint, and clearing a stage. Clearing a pair plays a bell-like ring.
- NG-32: Sounds follow the mute button from PL-19.

## Game Over

- NG-26: The game never ends by clearing the board. It ends only when no pair with line of sight exists and Add Numbers has no uses left for the current stage.
- NG-27: On game over, the game shows the final score and stage, records the result in the high scores, and offers to start a new game or return to the dashboard.
- NG-28: The player can leave a game at any time and continue it later from its save slot (see `players-saves-scores.md`).
