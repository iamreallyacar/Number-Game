# Block Game Rules

These requirements define how the Block Game plays. Rows are counted from top to bottom and columns from left to right.

## Terms

| Term | Meaning |
| --- | --- |
| Size (n) | Number of rows and of columns of the square board, chosen by the player at the start of a game |
| Cell | One square of the board. A cell is either empty or filled with a block |
| Shape | A group of blocks that is placed in one move, such as a 2 x 2 square |
| Bounding box | The smallest rectangle that holds every block of a shape. It is never bigger than 3 x 3 |
| Slot | One of the three places where the player's next shapes wait to be placed |
| Line | A full row or a full column of the board |
| Streak | The count of back-to-back placements that each cleared at least one line |

## Board

- BG-01: When starting a new game, the player chooses the size n from 8, 9, or 10. The board is n rows of n cells.
- BG-02: The board starts empty and never grows or shrinks during a game.
- BG-03: Thin grid lines separate every row and column, including empty cells, so the player can see where a shape will fit.

## Slots

- BG-04: The player always has 3 slots, each holding one random shape. A slot is never empty.

## Placing a Shape

- BG-05: A move places the shape from one slot onto the board. The move names the slot, and the row and column where the top-left corner of the shape's bounding box goes.
- BG-06: Every block of the shape must land on an empty cell inside the board. Empty parts of the bounding box may lie over filled cells. If a block would land outside the board or on a filled cell, nothing changes and the game shows clear feedback, such as the shape returning to its slot.
- BG-07: While the player drags a shape over the board, the game shows where it would land, and highlights the rows and columns that it would clear.

## Shapes

- BG-08: Every shape fits inside a 3 x 3 box. Shapes are dealt in a fixed orientation and the player cannot rotate them, so each orientation is its own shape.
- BG-09: The game deals the shapes below. Each shape has a fixed colour, and every block keeps the colour of the shape that placed it.

| Kind | Orientations | Blocks | Starting weight of each |
| --- | --- | --- | --- |
| Single cell | 1 | 1 | 4 |
| 2 cell line | Horizontal and vertical | 2 | 5 |
| 3 cell line | Horizontal and vertical | 3 | 5 |
| 2 x 2 square | 1 | 4 | 6 |
| 3 x 3 square | 1 | 9 | 1 |
| 2 x 3 rectangle | Wide and tall | 6 | 2 |
| Small corner | 4 | 3 | 4 |
| Big corner, a 3 x 3 L | 4 | 5 | 1 |
| L shape | 8, every turn and mirror | 4 | 2 |
| T shape | 4 | 4 | 2 |
| S and Z shapes | Wide and tall of each | 4 | 2 |
| 2 cell diagonal | Both directions | 2 | 1 |
| 3 cell diagonal | Both directions | 3 | 1 |
| Plus | 1 | 5 | 1 |

- BG-10: Each new shape is picked at random with a chance in proportion to its weight. The pick never looks at the board, so a shape that does not fit can be dealt. Every shape can appear, but awkward shapes, such as the 3 x 3 square, the diagonals, and the big corners, are rarer than small common ones. The weights are starting values and may be tuned after playtesting.

## Clearing Lines

- BG-11: After a shape is placed, every full row and every full column is cleared, all in one step. A cell where a cleared row crosses a cleared column counts for both lines.
- BG-12: Only the cells inside full lines are cleared. The rest of a placed shape stays, and blocks never fall or slide to fill gaps.
- BG-13: After the lines are cleared, the used slot is filled at once with a new random shape. The other two slots keep their shapes.

## Scoring

- BG-14: Points are awarded as shown below. These are starting values and may be tuned after playtesting.

| Event | Points |
| --- | --- |
| Placing a shape | 1 for each block of the shape |
| Clearing N lines with one placement | 10 x N x N, multiplied by the streak |

- BG-15: The first placement that clears a line has a streak of 1, and each following placement that clears a line adds 1. A placement that clears nothing sets the streak back to 0. For example, clearing 2 lines with a streak of 3 earns 10 x 2 x 2 x 3 = 120 line points.
- BG-16: The current score and streak are always visible during play.

## Effects and Sound

Effects only show what happened. They never change the rules, the score, or what is saved.

- BG-17: When lines are cleared, the cleared cells show a short effect and the points earned float up from the board.
- BG-18: Sounds follow the mute button from PL-19.

## Game Over

- BG-19: After a placement and the slot refill, the game is over when none of the 3 slot shapes fits anywhere on the board.
- BG-20: On game over, the game shows the final score and lines cleared, records the result in the high scores, and offers to start a new game or return to the dashboard. The player can leave a game at any time and continue it later from its save slot (see `players-saves-scores.md`).
- BG-21: Save slots and high scores show the score, the board size, and the number of lines cleared. High scores are filtered by board size.
