# Stored Values Package

This package holds the small checks every game needs when it reads a value back from storage, as plain TypeScript with no browser or server code. The game rules packages use it to check stored game states and summary details, and the server uses its upgrade type to run each game's stored format upgrades. See Storage in `apps/server/README.md`.

## Contract

Everything is exported through `src/index.ts`. The checks never throw. They report a bad value with `null` or `false`, so each game can throw its own error that names the game and the field.

## Files

| File | Job |
| --- | --- |
| `stored-values.ts` | The `StoredFormatUpgrade` type, reading the fields of a stored object, and the whole number check |
