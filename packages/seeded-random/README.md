# Seeded Random Package

This package holds the seeded random number generator shared by the game rules packages, as plain TypeScript with no browser or server code. A game keeps the generator state inside its game state, so the browser and the server draw exactly the same values from the same state, and a save continues with the same upcoming values on any device. See Randomness in `ARCHITECTURE.md`.

## Contract

Everything is exported through `src/index.ts`. Every function is pure: it takes a generator state and returns the drawn value together with the next state, without hidden randomness. Calling it with a bad argument, such as a seed that is not a whole number or an empty list, throws an error.

## Files

| File | Job |
| --- | --- |
| `seeded-random.ts` | Mulberry32 generator: seeds, fractions, even and weighted picks from a list, and shuffles |
