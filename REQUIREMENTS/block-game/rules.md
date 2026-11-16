# Block Game Rules

These requirements define how the Block Game plays. Rows are counted from top to bottom and columns from left to right.

## Terms

| Term | Meaning |
| --- | --- |
| Cell | One square of the board. A cell is either empty or filled with a block |
| Shape | A group of blocks that is placed in one move, such as a 2 x 2 square |
| Bounding box | The smallest rectangle that holds every block of a shape. It is never bigger than 5 x 5 |
| Slot | One of the three places where the player's shapes wait to be placed |
| Hand | The three shapes dealt together, one into each slot |
| Line | A full row or a full column of the board |
| Streak | The count of back-to-back placements that each cleared at least one line |

## Board

- BG-01: The board is always 10 rows of 10 cells. The player does not choose a size.
- BG-02: The board starts empty and never grows or shrinks during a game.
- BG-03: Thin grid lines separate every row and column, including empty cells, so the player can see where a shape will fit.

## Slots and Hands

- BG-04: The player has 3 slots. A new hand fills all 3 slots at once, one shape in each. A slot becomes empty when its shape is placed and stays empty until the next hand.
- BG-13: After a placement and its line clears, if all 3 slots are empty, a new hand is dealt at once. The player may place the shapes of a hand in any order.

## Placing a Shape

- BG-05: A move places the shape from one slot onto the board. The move names the slot, and the row and column where the top-left corner of the shape's bounding box goes. A move that names an empty slot is refused and nothing changes.
- BG-06: Every block of the shape must land on an empty cell inside the board. Empty parts of the bounding box may lie over filled cells. If a block would land outside the board or on a filled cell, nothing changes and the game shows clear feedback, such as the shape returning to its slot.
- BG-07: While the player drags a shape over the board, the game shows where it would land, and highlights the rows and columns that it would clear.

## Shapes

- BG-08: Every shape fits inside a 5 x 5 box. Shapes are dealt in a fixed orientation and the player cannot rotate them, so each orientation is its own shape.
- BG-09: The game deals the shapes below. Each shape has a fixed colour, and every block keeps the colour of the shape that placed it. Each orientation has a starting weight and a late weight, used by BG-10.

| Kind | Orientations | Blocks | Starting weight of each | Late weight of each |
| --- | --- | --- | --- | --- |
| Single cell | 1 | 1 | 4 | 1 |
| 2 cell line | Horizontal and vertical | 2 | 5 | 1 |
| 3 cell line | Horizontal and vertical | 3 | 5 | 2 |
| 4 cell line | Horizontal and vertical | 4 | 2 | 3 |
| 5 cell line | Horizontal and vertical | 5 | 1 | 4 |
| 2 x 2 square | 1 | 4 | 6 | 2 |
| 3 x 3 square | 1 | 9 | 1 | 4 |
| 4 x 4 square | 1 | 16 | 1 | 3 |
| 2 x 3 rectangle | Wide and tall | 6 | 2 | 4 |
| Small corner | 4 | 3 | 4 | 1 |
| Big corner, a 3 x 3 L | 4 | 5 | 1 | 4 |
| L shape | 8, every turn and mirror | 4 | 2 | 2 |
| T shape | 4 | 4 | 2 | 2 |
| Big T, a 3 x 3 T | 4 | 5 | 1 | 3 |
| U shape | 4 | 5 | 1 | 3 |
| S and Z shapes | Wide and tall of each | 4 | 2 | 3 |
| 2 cell diagonal | Both directions | 2 | 1 | 2 |
| 3 cell diagonal | Both directions | 3 | 1 | 4 |
| Plus | 1 | 5 | 1 | 4 |

- BG-10: Each shape of a hand is picked at random with a chance in proportion to its current weight. A game starts on the starting weights, where small shapes are common and big or awkward shapes are rare. The weights move in even steps toward the late weights with every shape placed, and reach them after 200 placements, where they stay. The same shape can appear more than once in a hand. The weights and the 200 are starting values and may be tuned after playtesting.
- BG-22: A hand is only dealt if it is fair. A hand is fair when there is at least one way to place all 3 of its shapes on the current board, in some order, counting the lines each placement clears. If the picked hand is not fair, the game picks a whole new hand, up to 30 times. The search for a way stops after trying 1000 placements for one hand, and a hand it has not shown to be fair by then counts as not fair. This keeps every deal quick, and the browser and the server always agree because the limit is a count and not a time.
- BG-23: If none of the 30 hands is fair, the hand is 3 single cells. This hand is always fair, because a board with no full line has at least 10 empty cells.

## Clearing Lines

- BG-11: After a shape is placed, every full row and every full column is cleared, all in one step. A cell where a cleared row crosses a cleared column counts for both lines.
- BG-12: Only the cells inside full lines are cleared. The rest of a placed shape stays, and blocks never fall or slide to fill gaps.

## Scoring

- BG-14: Points are awarded as shown below. These are starting values and may be tuned after playtesting.

| Event | Points |
| --- | --- |
| Placing a shape | 1 for each block of the shape |
| Clearing N lines with one placement | 10 x N x N, multiplied by the streak |

- BG-15: The first placement that clears a line has a streak of 1, and each following placement that clears a line adds 1. A placement that clears nothing sets the streak back to 0. For example, clearing 2 lines with a streak of 3 earns 10 x 2 x 2 x 3 = 120 line points. The streak carries over from one hand to the next.
- BG-16: The current score and streak are always visible during play.

## Effects and Sound

Effects only show what happened. They never change the rules, the score, or what is saved.

- BG-17: When lines are cleared, the cleared cells show a short effect and the points earned float up from the board.
- BG-18: Sounds follow the mute button from PL-19. Clearing lines shouts "wan sui" over a run of bells that grows with the number of lines and the streak, placing a shape plays a wooden knock, and game over plays a comic Chinese groan picked at random.

## Game Over

- BG-19: After a placement, the game is over when the hand still has shapes left and none of them fits anywhere on the board. Because every hand is fair when it is dealt (BG-22), a game only ends through the player's own placements within a hand.
- BG-20: On game over, the game shows the final score and lines cleared, records the result in the high scores, and offers to start a new game or return to the dashboard. The player can leave a game at any time and continue it later from its save slot (see `players-saves-scores.md`).
- BG-21: Save slots and high scores show the score and the number of lines cleared. All results share one high score category.
