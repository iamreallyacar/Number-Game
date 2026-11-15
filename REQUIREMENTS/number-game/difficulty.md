# Number Game Difficulty

The player picks a difficulty preset when starting a new game. Each preset changes a few settings. The values are starting points and may be tuned after playtesting.

## Presets

- DF-01: The game offers three presets: Easy, Normal, and Hard.
- DF-02: Add Numbers uses and hints are counted per stage and reset when a new stage starts (see NG-21).

| Setting | Easy | Normal | Hard |
| --- | --- | --- | --- |
| Add Numbers uses per stage | 8 | 5 | 3 |
| Hints per stage | Unlimited | 3 | None |
| Pairs with line of sight on a starting board | 18 to 28 | 8 to 14 | 2 to 6 |
| Chance that an added number is aimed | 80 percent | 50 percent | 35 percent |
| Sets of added numbers tried | 12 | 1 | 1 |

## Number Generation

- DF-04: A starting board aims for the count of pairs with line of sight shown in the table (see NG-35). The game builds a few boards and keeps the one closest to that range, so a board can sometimes fall just outside it.
- DF-05: Add Numbers uses the aim chance and the count of sets tried shown in the table (see NG-36). More sets give clearly more helpful numbers. In simulated play the aim chance changed the result much less.

## Hints

- DF-03: A hint button highlights one valid pair with line of sight. It is hidden when the preset allows no hints.

## Ideas for Later

These are not requirements. They are options to consider if the presets are not enough.

| Idea | Effect on difficulty | Notes |
| --- | --- | --- |
| Custom preset | Player sets each value | Adds screen complexity |
| Undo | Lets the player take back a match | Could be limited or cost points |
| Harder later stages | For example fewer Add Numbers uses as stages go up | Keeps endless play challenging |
| Add Numbers amount | Adding fewer numbers gives fewer new pairs | Base rule is 50 percent |
| Allowed line of sight directions | Turning off diagonal or reading order wrap makes matches rarer | Changes the core rules, so use with care |
| Time limit | Adds pressure | Might not suit relaxed phone play |
