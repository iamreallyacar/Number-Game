# Disk Game Rules

These requirements define how the Disk Game plays. Pegs are counted from left to right. Disks are numbered by size, so disk 1 is the smallest.

## Terms

| Term | Meaning |
| --- | --- |
| Peg | One of the three upright rods that hold disks |
| Disk | A flat ring with its own size. No two disks in a stage have the same size |
| Top disk | The disk at the top of a peg, which is the only one that can be moved |
| Disk count (n) | Number of disks in the current stage |
| Starting disk count | Disk count of the first stage, chosen by the player at the start of a game |
| Layout | Which peg each disk is on |
| Fewest moves | The smallest number of moves that gets every disk onto one peg from a layout, using whichever peg is quickest |
| Moves left | The move budget shared by every stage of a game |

## Pegs and Disks

- DK-01: The board has 3 pegs. Each peg holds any number of disks.
- DK-02: A larger disk is never on top of a smaller disk. This holds for every layout, from the start of a stage to its end.
- DK-03: Each disk size has its own colour and width, so sizes can be told apart at a glance.

## Starting a Stage

- DK-04: When starting a new game, the player chooses the starting disk count from 3, 4, or 5.
- DK-05: Each stage after the first has one more disk than the stage before, up to 10 disks. Stages after that keep 10 disks.
- DK-06: A new layout puts each disk on one of the 3 pegs at random, using the seeded random number generator stored in the game state. Each peg holds its disks from largest at the bottom to smallest at the top, so every layout follows DK-02.
- DK-07: If the fewest moves of a new layout is less than 2 to the power of (n − 2), the layout is thrown away and a new one is made. This removes layouts that are already sorted or nearly sorted. For 3 disks the fewest moves must be at least 2, and for 10 disks at least 256. About 7 in 10 random layouts pass. This is a starting value and may be tuned after playtesting.

## Moving a Disk

- DK-08: A move takes the top disk of one peg and puts it on top of another peg.
- DK-09: To move, the player taps a peg to pick up its top disk, which is then shown raised above the peg, and taps another peg to drop it there. Tapping the same peg again puts the disk back without making a move. Tapping an empty peg picks up nothing.
- DK-10: A disk cannot be dropped onto a smaller disk. If the player tries, nothing changes, no move is counted, and the game shows clear feedback, such as the disk shaking and staying raised.
- DK-11: Every move takes 1 from moves left.

## Undo and Hints

- DK-12: Undo takes back the last move of the current stage and costs 1 from moves left. It can be used again to go further back, up to the start of the stage. Moves from earlier stages cannot be undone. Because every move can be reversed by hand for the same cost, undo is a convenience and never gives an advantage.
- DK-13: A hint shows the next move of a shortest path to a sorted layout. It costs 2 from moves left. This is a starting value and may be tuned after playtesting.
- DK-14: Undo and hint are turned off when using them would end the game under DK-19.

## Clearing a Stage

- DK-15: A stage is cleared as soon as every disk is on one peg. Any of the 3 pegs counts.
- DK-16: When a stage starts, moves left goes up by 2 times the fewest moves of its layout. Moves not used in a stage carry over to the next one. The factor 2 is a starting value and may be tuned after playtesting.

## Scoring

- DK-17: Points are awarded as shown below. These are starting values and may be tuned after playtesting.

| Event | Points |
| --- | --- |
| Clearing a stage | 10 x the fewest moves of the stage's starting layout |
| Perfect stage, cleared in exactly the fewest moves with no undo or hint | 5 x the fewest moves of the stage's starting layout, on top of the clear points |

- DK-18: The score, stage, disk count, moves left, and the moves used in this stage next to the stage's fewest moves are always visible during play.

## Game Over

- DK-19: The game is over when moves left is less than the fewest moves from the current layout, because the stage can no longer be cleared. This is checked after every move, undo, and hint. A player who always plays a shortest path never reaches it.
- DK-20: On game over, the game shows the final score and the stage reached, records the result in the high scores, and offers to start a new game or return to the dashboard. The player can leave a game at any time and continue it later from its save slot (see `players-saves-scores.md`).
- DK-21: Save slots show the stage, score, starting disk count, and moves left. High scores show the score, the stage reached, and the starting disk count, and are filtered by starting disk count.

## Effects and Sound

Effects only show what happened. They never change the rules, the score, or what is saved.

- DK-22: Picking up, dropping, a refused drop, a hint, and clearing a stage each have a short sound. Sounds follow the mute button from PL-19.
- DK-23: Clearing a stage shows a short effect on the sorted peg and the points earned float up from it. Moving effects follow PL-20.
