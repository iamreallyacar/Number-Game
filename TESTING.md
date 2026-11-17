# Testing

This file describes how the project is tested. The command that runs every check is in `VERIFICATION TOOLS` in `CLAUDE.md`.

## Levels

- Unit tests: Vitest runs them, written next to the code as `*.test.ts` files. The rules packages, the server, and the browser app's routing, server calls, saving, and game logic helpers have them.
- Server tests: they use the app from `app.ts` with an in-memory database.
- Type checks: `svelte-check` checks the Svelte components with the same strict settings as the rest.

## Helpers and fixtures

- `apps/server/src/test-support.ts`: the test server, save builders, and the `ManualScheduler` that moves time by hand, so the step loop, the connection checks, and the waiting room expiry are tested without waiting. Left out of the build.
- `apps/server/src/counter-test-game.ts` and `apps/server/src/fake-room-test-game.ts`: a tiny saved game and a tiny room game used by the tests of shared code, so those tests do not depend on the rules of a real game. Left out of the build.
- `apps/web/src/test-support/`: helpers for the browser app tests, such as a local storage kept in memory.

## Known gaps

The Svelte components do not have tests. Tests for `router.ts`, the Svelte components, and the Block Game pointer handling are listed in `REQUIREMENTS/BACKLOG.md` (T-96).

## Pitfalls

The apps use the built `dist` folder of each package, so tests and type checks of the apps see an old package until it is built. See Tools in `GUIDE.md`.
