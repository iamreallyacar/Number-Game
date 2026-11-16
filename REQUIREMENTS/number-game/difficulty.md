# Number Game Difficulty

The player picks a difficulty preset when starting a new game. Each preset changes a few settings. The values are starting points and may be tuned after playtesting.

## Presets

- DF-01: The game offers three presets: Easy, Normal, and Hard.
- DF-02: Add Numbers uses and hints are counted per stage and reset when a new stage starts (see NG-21).

| Setting | Easy | Normal | Hard |
| --- | --- | --- | --- |
| Add Numbers uses per stage | 8 | 5 | 3 |
| Hints per stage | Unlimited | 3 | None |
| Pairs with line of sight on a starting board | 5 or 6 | 3 or 4 | 1 or 2 |

## Number Generation

- DF-04: A starting board opens with the count of pairs with line of sight shown in the table (see NG-35), for the first stage and every later one. The game keeps building boards until one lands in that range, up to 60 tries, and otherwise keeps the closest. In simulated play every one of 3000 boards per preset landed in the range, mostly at its top end. A typical board took about 8 ms to build on Easy and Normal and 14 ms on Hard on a desktop computer, and the slowest took about 175 ms, so a phone may take a few times longer.
- DF-05: Add Numbers works the same on every preset: each new number is aimed with a 50 percent chance, and 1 set of new numbers is built (see NG-36). Only the count of uses per stage changes between presets. In simulated play, trying more sets made every preset much easier, and the aim chance changed the result much less.

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
